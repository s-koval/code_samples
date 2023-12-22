import Agenda from 'agenda';
import { User, Deal, Request, Notification, Property } from '../models';
import getDealStatuses from '../constants/getDealStatuses';
import getServiceRequestStatus from './getServiceRequestStatus';
import statusRequestJobHandler from '../jobs/statusRequestJobHandler';
import getExpirationFormattedString from './getExpirationFormattedString';
import unlockAccountJobHandler from '../jobs/unlockAccountJobHandler';
import blockAccountExpiration from '../constants/blockAccountExpiration';
import {
    lockAccountNotifications,
    lockAccountSmsNotifications,
    unlockAccountNotifications, unlockAccountSmsNotifications
} from '../constants/systemNotifications';
import sendNotifications from './notifications';
import config from '../config';

const mongoConnectionString = config.DB_CONNECTION_STRING;
let agenda = new Agenda({
    db: {
        address: mongoConnectionString,
        collection: 'jobs',
        options: { useNewUrlParser: true }
    }
});

agenda.define('checkIsCompletedDeal', async (job) => {

    const dealId = job.attrs.data.dealId;
    const deal = await Deal.findById(dealId);
    deal.showMessagesSettings.showDealCompletedMessage = true;
    await agenda.cancel({ 'data.dealId': dealId });
    await deal.save();
    const property = await Property.findById(deal.property);
    const seller = await User.findById(deal.seller);
    const buyer = await User.findById(deal.buyer);

    const status = getDealStatuses('offerAcceptedWaitingDealComplete');

    const notifications = status.notifications(buyer, seller, deal, property);

    if (notifications && notifications.length > 0) {
        notifications.forEach(async notification => {
            await Notification.create(notification);
        });
    }

    await seller.sendDealIsCompletedEmail(property, deal);
    await buyer.sendDealIsCompletedEmail(property, deal);

    const smsNotifications = status.smsNotifications(buyer, seller, deal, property);

    if (smsNotifications.sellerMessage) {
        seller.sendSmsReminder(smsNotifications.sellerMessage);
    }
    if (smsNotifications.buyerMessage) {
        buyer.sendSmsReminder(smsNotifications.buyerMessage);
    }

});

agenda.define('waitingProviderJobHandler', async (job) => {

    const requestId = job.attrs.data.requestId;

    const requestType = job.attrs.data.requestType;

    const status = getServiceRequestStatus(requestType, job.attrs.data.status);

    const serviceRequest = await Request.findById(requestId);
    const deal = await Deal.findById(serviceRequest.dealId);
    const customer = await User.findById(serviceRequest.ownerId);
    const property = await Property.findById(deal.property);

    await Request.findOneAndUpdate({ '_id': serviceRequest.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

    let offer;

    const [minOffer] = await Request.aggregate([
            [{ $match: { '_id': serviceRequest._id } },
                { $unwind: '$offers' },
                { $sort: { 'offers.offer': 1 } },
                { $limit: 1 },
                { $project: { _id: 0, providerId: '$offers.providerId', offer: '$offers.offer' } }
            ]
        ]
    );

    if (requestType === 'solicitor' && minOffer) {

        const dealRequestsIds = [];

        deal.providerRequests.forEach(item => {
            dealRequestsIds.push(item.requestId);

        });

        const dealSolicitorRequest = await Request.findOne({
            '_id': { $in: dealRequestsIds },
            requestType: 'solicitor',
            'bestOffer.providerId': minOffer.providerId
        });

        if (dealSolicitorRequest) {

            if (serviceRequest.offers.length > 1) {

                const offers = await Request.aggregate([
                        [
                          { $match: { '_id': serviceRequest._id } },
                          { $unwind: '$offers' },
                          { $sort: { 'offers.offer': 1 } },
                          { $limit: 2 },
                          { $project: { _id: 0, providerId: '$offers.providerId', offer: '$offers.offer' } }
                        ]
                    ]
                );
                offer = offers[1];
            }
        } else {
            offer = minOffer;
        }
    } else {
        offer = minOffer;
    }

    if (offer) {

        serviceRequest.bestOffer.offer = offer.offer;
        serviceRequest.bestOffer.providerId = offer.providerId;

        serviceRequest.requestStatus = {
            status: status.requestSuccessStatus,
            displayStatus: status.displaySuccessRequestStatus,
            expiredAt: status.successExpiration()
        };

        const provider = await User.findById(offer.providerId);
        const successRequestMessages = status.successRequestMessages(customer, provider, offer.offer, serviceRequest);

        successRequestMessages.forEach((message) => {
            serviceRequest.dialog.push(message);
        });

        const successNotifications = status.successNotifications(customer, provider, serviceRequest, deal, property);

        if (successNotifications && successNotifications.length > 0) {

            successNotifications.forEach(async notification => {
                await Notification.create(notification);
            });
        }

        await serviceRequest.save();

    } else {
        serviceRequest.requestStatus = {
            status: status.failRequestStatus,
            displayStatus: status.displayFailRequestStatus,
            expiredAt: status.failExpiration()
        };

        const failRequestMessages = status.failRequestMessages(customer);

        failRequestMessages.forEach((message) => {
            serviceRequest.dialog.push(message);
        });

        const failNotifications = status.failNotifications(customer, null, serviceRequest, deal, property);

        if (failNotifications && failNotifications.length > 0) {

            failNotifications.forEach(async notification => {
                await Notification.create(notification);
            });
        }

        await serviceRequest.save();

        const buyer = await User.findById(deal.buyer);
        const seller = await User.findById(deal.seller);

        if (requestType === 'valuer') {

            const failDealMessages = status.failDealMessages(buyer, seller, deal);
            failDealMessages.forEach((message) => {
                deal.dialog.push(message);
            });
            await deal.save();
        }
    }

    await agenda.cancel({ 'data.requestId': requestId });

});

agenda.define('statusRequestJobHandler', async (job) => {

    const requestId = job.attrs.data.requestId;

    const requestType = job.attrs.data.requestType;
    await agenda.cancel({ 'data.requestId': requestId });

    const status = getServiceRequestStatus(requestType, job.attrs.data.status);

    const serviceRequest = await Request.findById(requestId);

    await Request.findOneAndUpdate({ '_id': serviceRequest.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

    const customer = await User.findById(serviceRequest.ownerId);
    const provider = await User.findById(serviceRequest.bestOffer.providerId);
    const deal = await Deal.findById(serviceRequest.dealId);
    const property = await Property.findById(deal.property);
    const seller = await User.findById(deal.seller);

    if (serviceRequest.requestStatus.repeatStatus) {

        serviceRequest.requestStatus = {
            status: status.requestRepeatStatus,
            displayStatus: status.displayRepeatRequestStatus,
            expiredAt: status.repeatExpiration(),
            repeatStatus: false
        };

        await Request.findOneAndUpdate({ '_id': serviceRequest.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

        let requestRepeatMessages = status.requestRepeatMessages(customer, provider, serviceRequest, seller);
        requestRepeatMessages.forEach((message) => {
            serviceRequest.dialog.push(message);
        });

        const repeatNotifications = status.repeatNotifications(customer, provider, serviceRequest, deal, property, seller);

        if (repeatNotifications && repeatNotifications.length > 0) {

            repeatNotifications.forEach(async notification => {

                await Notification.create(notification);
            });
        }

        const repeatSmsNotifications = status.repeatSmsNotifications(customer, provider, serviceRequest, deal, property, seller);

        if (repeatSmsNotifications && repeatSmsNotifications.customerMessage) {
            await customer.sendSmsReminder(repeatSmsNotifications.customerMessage);
        }

        if (repeatSmsNotifications && repeatSmsNotifications.providerMessage) {
            await provider.sendSmsReminder(repeatSmsNotifications.providerMessage);
        }
        if (repeatSmsNotifications && repeatSmsNotifications.sellerMessage) {
            await seller.sendSmsReminder(repeatSmsNotifications.sellerMessage);
        }

        await serviceRequest.save();

        await statusRequestJobHandler(serviceRequest, status, true);

        const expiration = getExpirationFormattedString(status.repeatExpirationData);

        if (serviceRequest.requestStatus.status === 'waitingCustomerToSelectDate') {

            if (serviceRequest.requestType === 'surveyor') {

                await seller.sendRequestActionReminderEmail(property, deal, serviceRequest, expiration);
            } else {
                await customer.sendRequestActionReminderEmail(property, deal, serviceRequest, expiration);

            }

        }
        if (serviceRequest.requestStatus.status === 'acceptedWaitingAvailableTimeSlots' || serviceRequest.requestStatus.status === 'waitingProviderToSelectDate' || serviceRequest.requestStatus.status === 'awaitingValuationResults') {
            await provider.sendRequestActionReminderEmail(property, deal, serviceRequest, expiration);
        }

    } else {

        if (serviceRequest.requestStatus.status === 'acceptedWaitingAvailableTimeSlots'
            || serviceRequest.requestStatus.status === 'waitingProviderToSelectDate'
            || (serviceRequest.requestType === 'valuer' && serviceRequest.requestStatus.status === 'awaitingValuationResults')) {

            const user = await User.findOneAndUpdate(
                { '_id': provider.id },
                { $set: { 'accounts.$[item].account.blocked': true } },
                {
                    arrayFilters: [{ 'item.account.accountType': serviceRequest.requestType }],
                    multi: true,
                    new: true
                });

            sendNotifications.sendToUsers([user.id], 'accountLocked', {});

            const notifications = lockAccountNotifications(provider, serviceRequest.requestType, null);

            if (notifications && notifications.length > 0) {

                notifications.forEach(async notification => {

                    await Notification.create(notification);
                });
            }

            await provider.sendSmsNotification(lockAccountSmsNotifications(provider));

            await unlockAccountJobHandler(provider, serviceRequest.requestType, blockAccountExpiration());

        }

        serviceRequest.requestStatus = {
            status: status.requestFailStatus,
            displayStatus: status.displayRequestFailStatus,
            expiredAt: status.failExpiration()
        };

        await Request.findOneAndUpdate({ '_id': serviceRequest.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

        let failRequestMessages = status.failRequestMessages(customer, provider, serviceRequest, seller);
        failRequestMessages.forEach((message) => {
            serviceRequest.dialog.push(message);
        });

        const failNotifications = status.failNotifications(customer, provider, serviceRequest, deal, property, seller);

        if (failNotifications && failNotifications.length > 0) {

            failNotifications.forEach(async notification => {
                await Notification.create(notification);
            });
        }

        const failSmsNotifications = status.failSmsNotifications(customer, provider, serviceRequest, deal, property, seller);

        if (failSmsNotifications && failSmsNotifications.customerMessage) {
            await customer.sendSmsNotification(failSmsNotifications.customerMessage);
        }

        if (failSmsNotifications && failSmsNotifications.providerMessage) {
            await provider.sendSmsNotification(failSmsNotifications.providerMessage);
        }
        if (failSmsNotifications && failSmsNotifications.sellerMessage) {
            await seller.sendSmsNotification(failSmsNotifications.sellerMessage);
        }

        await serviceRequest.save();
    }

});

agenda.define('checkAppointmentIsCompleted', async (job) => {

    const requestId = job.attrs.data.requestId;
    const serviceRequest = await Request.findById(requestId);
    const customer = await User.findById(serviceRequest.ownerId);
    const provider = await User.findById(serviceRequest.bestOffer.providerId);
    const deal = await Deal.findById(serviceRequest.dealId);
    const property = await Property.findById(deal.property);
    const seller = await User.findById(deal.seller);
    serviceRequest.showMessagesSettings.showAppointmentIsCompletedMessage = true;
    await agenda.cancel({ 'data.requestId': requestId });
    await serviceRequest.save();

    const status = getServiceRequestStatus(serviceRequest.requestType, 'appointmentAcceptedWaitingRequestComplete');

    const notifications = status.notifications(customer, provider, serviceRequest, deal, property, seller);

    if (notifications && notifications.length > 0) {

        notifications.forEach(async notification => {

            await Notification.create(notification);
        });
    }

    const smsNotifications = status.smsNotifications(customer, provider, serviceRequest, deal, property, seller);

    if (smsNotifications && smsNotifications.customerMessage) {
        await customer.sendSmsNotification(smsNotifications.customerMessage);
    }

    if (smsNotifications && smsNotifications.providerMessage) {
        await provider.sendSmsNotification(smsNotifications.providerMessage);
    }
    if (smsNotifications && smsNotifications.sellerMessage) {
        await seller.sendSmsNotification(smsNotifications.sellerMessage);
    }

    if (serviceRequest.requestType === 'surveyor') {

        await seller.sendRequestAppointmentIsCompleteEmail(property, deal, serviceRequest);

    } else {

        await customer.sendRequestAppointmentIsCompleteEmail(property, deal, serviceRequest);
    }

    await provider.sendRequestAppointmentIsCompleteEmail(property, deal, serviceRequest);

});

agenda.define('unlockUser', async (job) => {

    const userId = job.attrs.data.userId;
    const accountType = job.attrs.data.accountType;

    const user = await User.findOneAndUpdate(
        { '_id': userId },
        { $set: { 'accounts.$[item].account.blocked': false } },
        {
            arrayFilters: [{ 'item.account.accountType': accountType }],
            multi: true,
        });

    await agenda.cancel({ 'data.userId': userId, 'data.accountType': accountType });

    sendNotifications.sendToUsers([user.id], 'accountUnlocked', {});

    const notifications = unlockAccountNotifications(user, accountType, null);

    if (notifications && notifications.length > 0) {

        notifications.forEach(async notification => {
            await Notification.create(notification);
        });
    }

    await user.sendSmsNotification(unlockAccountSmsNotifications(user));

});

agenda.define('activateProperty', async (job) => {

    const propertyId = job.attrs.data.propertyId;

    await Property.findOneAndUpdate(
        { '_id': propertyId },
        { $set: { status: 'active' } },
    );

    await agenda.cancel({ 'data.propertyId': propertyId });

});

agenda.on('ready', () => {
    agenda.start();
});

export default agenda;
