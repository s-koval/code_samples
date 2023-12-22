import { successResponse } from '../../utils/response';
import APIError from '../../utils/error';
import { User, Property, Deal, Request, Notification } from '../../models';
import { accountTypes } from '../../constants/userConstants';
import refuseMessages from '../../constants/refuseServiceMessages';
import statusDealJobHandler from '../../jobs/statusDealJobHandler';
import getDealStatuses from '../../constants/getDealStatuses';
import agenda from '../../utils/agenda';
import markDealAsCompletedJobHandler from '../../jobs/markDealAsCompletedJobHandler';
import { propertyStatuses } from '../../constants/propertyConstants';
import getServiceRequestStatus from '../../utils/getServiceRequestStatus';
import getStaticMap from '../../utils/getStreetViewImage';
import createPdf from '../../utils/createPdf';
import getExpirationFormattedString from '../../utils/getExpirationFormattedString';
import sendPdfToAdmin from '../../utils/sendPdfToAdmin';
import moment from 'moment';
import numberFormatter from '../../utils/numberFormatter';

const crypto = require('crypto');

const dealsController = {
    list: async (req, res, next) => {
        try {
            const { user: { id: userId } } = req;
            const deals = await Deal
                .find({ $or: [{ seller: userId }, { buyer: userId }, { 'providerRequest.providerId': userId }] })
                .populate('seller', ['name', 'avatar', 'email', 'phone'])
                .populate('buyer', ['name', 'avatar', 'email', 'phone'])
                .populate('property', ['price','type', 'subType', 'address', 'description', 'photos', 'map', 'listed', 'status', 'elasticId'])
                .populate('providerRequests.requestId', ['ownerId', 'requestType', 'bestOffer', 'additionalOwnerId', 'showContactDetailsSettings'])
                .populate('providerRequests.providerId', ['id', 'name', 'email', 'phone', 'avatar', 'companyName']);

            return successResponse(res, deals);
        } catch (err) {
            next(err);
        }
    },

    get: async (req, res, next) => {
        try {
            const { user: { id: userId }, params: { id } } = req;
            const deal = await Deal.findOne({
                $or: [{ '_id': id, seller: userId }, {
                    '_id': id,
                    buyer: userId
                }, { '_id': id, 'providerRequests.providerId': userId }]
            })
                .populate('seller', ['name', 'avatar', 'email', 'phone'])
                .populate('buyer', ['name', 'avatar', 'email', 'phone'])
                .populate('property', ['price','type', 'subType', 'address', 'description', 'photos', 'map', 'listed', 'status', 'elasticId'])
                .populate('providerRequests.requestId', ['ownerId', 'requestType', 'bestOffer', 'additionalOwnerId', 'showContactDetailsSettings'])
                .populate('providerRequests.providerId', ['id', 'name', 'email', 'phone', 'avatar', 'companyName']);

            if (!deal) {
                return next(new APIError('Not found.', 404));
            }

            return successResponse(res, deal);
        } catch (err) {
            next(err);
        }
    },

    markAsRead: async (req, res, next) => {
        try {
            const { user: { id: userId }, params: { id } } = req;

            const deal = await Deal.findOneAndUpdate(
                { '_id': id },
                { $set: { 'dialog.$[item].isRead': true } },
                {
                    arrayFilters: [{ 'item.to': userId }],
                    multi: true, new: true
                });

            return successResponse(res, deal);
        } catch (err) {
            next(err);
        }
    },

    create: async (req, res, next) => {

        try {
            const { user, body: { property, provisionalOffer, purchaseStatus } } = req;

            if (user.accountType === accountTypes.customer) {

                if (property.seller && property.seller === user.id) {
                    return next(new APIError('Owner can\'t make offers', 403));
                } else {
                    let deal;

                    if (property.listed === 'notListed') {

                        let respondingKey;

                        do {
                            const key = await crypto.randomBytes(16).toString('hex').substr(0, 16).toUpperCase();

                            const oldDeal = await Deal.findOne({
                                'respondingKey.key': key,
                            });
                            if (!oldDeal) {
                                respondingKey = key;
                            }
                        } while (!respondingKey);

                        const notifiedData = {
                            respondingKey: respondingKey,
                            buyerName: user.name,
                            buyerEmail: user.email,
                            address: property.formattedAddress,
                            udprn: property.address.udprn,
                            uprn: property.address.uprn

                        };

                        const additionalInfo = {
                            notListedInfo: {
                                uprn: property.address.uprn,
                                udprn: property.address.udprn,
                            }
                        };

                        let draftProperty = await Property.findOne({ 'additionalInfo.notListedInfo.uprn': property.address.uprn });

                        if (draftProperty) {

                            const currentDeals = await Deal.find({ buyer: user.id, property: draftProperty.id });

                            if (currentDeals.length > 0) {

                                return next(new APIError('Offer already send', 422));
                            }

                        }

                        if (!draftProperty) {

                            let map = {};
                            let uploadedDocuments = [];

                            await getStaticMap(map, property.address, uploadedDocuments, true);

                            draftProperty = await Property.create({
                                elasticId: property.address.uprn,
                                type: property.type,
                                address: property.address,
                                description: property.description,
                                listed: property.listed,
                                status: property.status,
                                additionalInfo: additionalInfo,
                                map: map
                            });
                        }

                        deal = await Deal.create({
                            buyer: user.id,
                            provisionalOffer,
                            purchaseStatus,
                            isDealPropertyListed: false
                        });

                        deal.property = draftProperty.id;
                        const status = getDealStatuses('waitingSellerPropertyNotListed');
                        deal.dealStatus = {
                            status: status.dealStatus,
                            displayStatus: status.displayStatus,
                            expiredAt: status.expiration()
                        };
                        deal.respondingKey = { key: respondingKey, expiredAt: status.expiration() };

                        const messages = status.messages(user, deal, provisionalOffer, purchaseStatus, draftProperty);
                        messages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        await statusDealJobHandler(deal, status);
                        await deal.save();

                        const createdAt = deal.createdAt;
                        const expiration = getExpirationFormattedString(status.expirationData);
                        const registeredHomeowner = await User.findOne({ 'address.uprn': draftProperty.address.uprn });
                        const data = await createPdf(user, draftProperty, respondingKey, createdAt, expiration);

                        if (registeredHomeowner) {

                            const formattedKey = respondingKey.match(/.{1,4}/g).join(' – ');
                            const buyerName = user.name.first;
                            const buyerPostalCode = user.address.postalCode.split(' ')[0];
                            const propertyAddress = draftProperty.address.formattedAddress;
                            const createdAtFormattedString = moment(createdAt).format('dddd, MMMM Do YYYY, h:mm a');
                            const offer = numberFormatter(provisionalOffer);

                            registeredHomeowner.sendEmailAboutNewOfferToHomeowner(buyerName, buyerPostalCode, propertyAddress, createdAtFormattedString, expiration, offer, formattedKey, data);

                            const smsNotifications = status.registeredHomeownerSmsNotification(registeredHomeowner, buyerName, buyerPostalCode, propertyAddress, offer, formattedKey);

                            if (smsNotifications && smsNotifications.homeownerMessage) {
                                await registeredHomeowner.sendSmsNotification(smsNotifications.homeownerMessage);

                            }

                        } else {

                            await sendPdfToAdmin(user, draftProperty, createdAt, provisionalOffer, data);
                        }

                        await user.offerSuccessfullySendBuyerEmail(draftProperty);

                    } else if (property.listed === 'listed') {

                        deal = await Deal.create({
                            buyer: user.id,
                            provisionalOffer,
                            purchaseStatus
                        });
                        const seller = await User.findById(property.seller);
                        deal.property = property._id;
                        deal.seller = property.seller;
                        const status = getDealStatuses('waitingSeller');
                        deal.dealStatus = {
                            status: status.dealStatus,
                            displayStatus: status.displayStatus,
                            expiredAt: status.expiration()
                        };
                        const messages = status.messages(user, deal, provisionalOffer, purchaseStatus, property, seller);
                        messages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        await deal.save();

                        await statusDealJobHandler(deal, status);

                        const notifications = status.notifications(user, seller, deal, property);

                        if (notifications && notifications.length > 0) {
                            notifications.forEach(async notification => {

                                await Notification.create(notification);

                            });
                        }

                        const smsNotifications = status.smsNotifications(user, seller, deal, property);

                        if (smsNotifications && smsNotifications.sellerMessage) {
                            await seller.sendSmsNotification(smsNotifications.sellerMessage);

                        }
                        if (smsNotifications && smsNotifications.buyerMessage) {
                            await user.sendSmsNotification(smsNotifications.buyerMessage);

                        }
                    }

                    return successResponse(res, deal);
                }

            } else {
                return next(new APIError('Service provider can\'t make offers', 403));
            }

        } catch (err) {

            next(err);
        }
    },

    rejectProvisionalOffer: async (req, res, next) => {
        try {
            const { user, params: { id }, body: { cancelReasons } } = req;

            const status = getDealStatuses('rejectedDealCancelled');

            const deal = await Deal.findOne({
                '_id': id,
                seller: user.id,
                'dealStatus.status': { $in: ['waitingSeller', 'waitingSellerPropertyNotListed', 'tentative'] }
            });

            if (deal) {

                deal.dealStatus = {
                    status: status.dealStatus,
                    displayStatus: status.displayStatus,
                    expiredAt: status.expiration()
                };
                let messages = status.messages(user, deal);
                messages.forEach((message) => {
                    deal.dialog.push(message);
                });

                if (cancelReasons) {
                    deal.cancelReasons.sellerReasons = cancelReasons;
                }

                deal.showMessagesSettings.seller.showSolicitorButton = false;
                deal.showMessagesSettings.seller.showSolicitorQuestion = false;
                deal.showMessagesSettings.seller.showValuationButton = false;
                deal.showMessagesSettings.seller.showValuationQuestion = false;

                deal.showMessagesSettings.buyer.showSolicitorButton = false;
                deal.showMessagesSettings.buyer.showSolicitorQuestion = false;
                deal.showMessagesSettings.buyer.showSurveyorButton = false;
                deal.showMessagesSettings.buyer.showSurveyorQuestion = false;

                await deal.save();

                await agenda.cancel({ 'data.dealId': id });

                const buyer = await User.findById(deal.buyer);
                const property = await Property.findById(deal.property);

                const notifications = status.notifications(buyer, user, deal, property);

                if (notifications && notifications.length > 0) {
                    notifications.forEach(async notification => {
                        await Notification.create(notification);
                    });
                }

                const smsNotifications = status.smsNotifications(buyer, user, deal, property);

                if (smsNotifications && smsNotifications.sellerMessage) {
                    await user.sendSmsNotification(smsNotifications.sellerMessage);
                }

                if (smsNotifications && smsNotifications.buyerMessage) {
                    await buyer.sendSmsNotification(smsNotifications.buyerMessage);
                }

                return successResponse(res, { deal, message: 'Deal updated successfully' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }
        } catch (err) {
            next(err);
        }
    },
    markAsTentative: async (req, res, next) => {
        try {
            const { user, params: { id } } = req;

            const status = getDealStatuses('tentative');

            const deal = await Deal.findOne({
                '_id': id,
                seller: user.id,
                'dealStatus.status': { $in: ['waitingSeller', 'waitingSellerPropertyNotListed'] }
            });

            if (deal) {
                await Deal.findOneAndUpdate({ '_id': deal.id }, { $unset: { 'dialog.$[].currentStatus': '' } });
                deal.dealStatus = {
                    status: status.dealStatus,
                    displayStatus: status.displayStatus,
                    expiredAt: status.expiration()
                };
                let messages = status.messages(user, deal);
                messages.forEach((message) => {
                    deal.dialog.push(message);
                });
                await deal.save();

                await statusDealJobHandler(deal, status);
                const buyer = await User.findById(deal.buyer);
                const property = await Property.findById(deal.property);
                const notifications = status.notifications(buyer, user, deal, property);

                if (notifications && notifications.length > 0) {
                    notifications.forEach(async notification => {
                        await Notification.create(notification);
                    });
                }
                const smsNotifications = status.smsNotifications(buyer, user, deal, property);

                if (smsNotifications && smsNotifications.sellerMessage) {
                    await user.sendSmsNotification(smsNotifications.sellerMessage);
                }

                if (smsNotifications && smsNotifications.buyerMessage) {
                    await buyer.sendSmsNotification(smsNotifications.buyerMessage);
                }

                return successResponse(res, { deal, message: 'Deal updated successfully' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }
        } catch (err) {
            next(err);

        }
    },
    acceptProvisionalOffer: async (req, res, next) => {
        try {
            const { user, params: { id } } = req;

            const deal = await Deal.findOne({
                '_id': id,
                seller: user.id,
                'dealStatus.status': { $in: ['waitingSeller', 'waitingSellerPropertyNotListed', 'tentative'] }
            });

            if (deal) {
                const property = await Property.findById(deal.property);

                if (property.listed === 'listed') {

                    const status = getDealStatuses('acceptedWaitingValuation');

                    await Deal.findOneAndUpdate({ '_id': deal.id }, { $unset: { 'dialog.$[].currentStatus': '' } });
                    deal.dealStatus = {
                        status: status.dealStatus,
                        displayStatus: status.displayStatus,
                        expiredAt: status.expiration(),
                        repeatStatus: true
                    };
                    const messages = status.messages(user, deal);
                    messages.forEach((message) => {
                        deal.dialog.push(message);
                    });
                    deal.showMessagesSettings.seller.showValuationButton = true;
                    deal.showMessagesSettings.seller.showValuationQuestion = true;

                    deal.showMessagesSettings.buyer.showSolicitorQuestion = true;
                    deal.showMessagesSettings.buyer.showSolicitorButton = true;

                    await deal.save();

                    await statusDealJobHandler(deal, status);

                    const buyer = await User.findById(deal.buyer);

                    const notifications = status.notifications(buyer, user, deal, property);

                    if (notifications && notifications.length > 0) {
                        notifications.forEach(async notification => {
                            await Notification.create(notification);
                        });
                    }

                    const smsNotifications = status.smsNotifications(buyer, user, deal, property);

                    if (smsNotifications && smsNotifications.sellerMessage) {
                        await user.sendSmsNotification(smsNotifications.sellerMessage);

                    }
                    if (smsNotifications && smsNotifications.buyerMessage) {
                        await buyer.sendSmsNotification(smsNotifications.buyerMessage);

                    }

                } else {

                    const status = getDealStatuses('acceptedWaitingPropertyDetails');

                    await Deal.findOneAndUpdate({ '_id': deal.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

                    deal.dealStatus = {
                        status: status.dealStatus,
                        displayStatus: status.displayStatus,
                        expiredAt: status.expiration(),
                        repeatStatus: true
                    };
                    const messages = status.messages(user, deal);
                    messages.forEach((message) => {
                        deal.dialog.push(message);
                    });

                    await deal.save();

                    await statusDealJobHandler(deal, status);

                    const buyer = await User.findById(deal.buyer);

                    const notifications = status.notifications(buyer, user, deal, property);

                    if (notifications && notifications.length > 0) {
                        notifications.forEach(async notification => {
                            await Notification.create(notification);
                        });
                    }
                    const smsNotifications = status.smsNotifications(buyer, user, deal, property);

                    if (smsNotifications && smsNotifications.sellerMessage) {
                        await user.sendSmsNotification(smsNotifications.sellerMessage);
                    }

                    if (smsNotifications && smsNotifications.buyerMessage) {
                        await buyer.sendSmsNotification(smsNotifications.buyerMessage);
                    }
                }

                return successResponse(res, { deal, message: 'Deal updated successfully' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }
        } catch (err) {
            next(err);
        }
    },
    addOffer: async (req, res, next) => {
        try {
            const { user, params: { id }, body: { offer } } = req;
            let status;
            let messages;
            let notifications;
            let smsNotifications;

            const deal = await Deal.findOne({
                '_id': id,
                $or: [
                  {
                    buyer: user.id,
                    'dealStatus.status': { $in: ['waitingBuyerToApproveOffer', 'waitingBuyerAndSellerToApproveOffer'] }
                  },
                  {
                    seller: user.id,
                    'dealStatus.status': { $in: ['waitingSellerToApproveOffer', 'acceptedWaitingValuation', 'waitingBuyerAndSellerToApproveOffer'] }
                  }
                ]
            });

            if (deal) {

                const currentStatus = deal.dealStatus.status;
                const seller = await User.findById(deal.seller);

                const buyer = await User.findById(deal.buyer);
                const property = await Property.findById(deal.property);

                await Deal.findOneAndUpdate({ '_id': deal.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

                if (user.id === deal.buyer.toString()) {
                    status = getDealStatuses('waitingSellerToApproveOffer');
                    deal.buyerOffer = offer;

                }
                if (user.id === deal.seller.toString()) {
                    status = getDealStatuses('waitingBuyerToApproveOffer');
                    deal.sellerOffer = offer;

                }
                deal.dealStatus = {
                    status: status.dealStatus,
                    displayStatus: status.displayStatus,
                    expiredAt: status.expiration(),
                    repeatStatus: true
                };

                if (user.id === deal.buyer.toString()) {

                    if (currentStatus === 'waitingBuyerToApproveOffer') {
                        messages = status.rejectOfferMessages(user, deal, offer);
                        notifications = status.rejectOfferNotifications(buyer, seller, deal, property);
                        smsNotifications = status.rejectOfferSmsNotifications(buyer, seller, deal, property);

                    } else if (currentStatus === 'waitingBuyerAndSellerToApproveOffer') {
                        messages = status.rejectValuationResultMessages(user, deal, offer);

                        notifications = status.rejectedValuationResultNotifications(buyer, seller, deal, property);
                        smsNotifications = status.rejectedValuationResultSmsNotifications(buyer, seller, deal, property);

                    } else {
                        messages = status.messages(user, deal, offer);
                    }
                }
                if (user.id === deal.seller.toString()) {

                    if (currentStatus === 'waitingSellerToApproveOffer') {
                        messages = status.rejectOfferMessages(user, deal, offer);

                        notifications = status.rejectOfferNotifications(buyer, seller, deal, property);
                        smsNotifications = status.rejectOfferSmsNotifications(buyer, seller, deal, property);

                    } else if (currentStatus === 'waitingBuyerAndSellerToApproveOffer') {
                        messages = status.rejectValuationResultMessages(user, deal, offer);
                        notifications = status.rejectedValuationResultNotifications(buyer, seller, deal, property);
                        smsNotifications = status.rejectedValuationResultSmsNotifications(buyer, seller, deal, property);

                    } else {
                        messages = status.messages(user, deal, offer);

                        notifications = status.notifications(buyer, seller, deal, property);
                        smsNotifications = status.smsNotifications(buyer, seller, deal, property);

                    }
                }

                messages.forEach((message) => {
                    deal.dialog.push(message);
                });

                await deal.save();

                await statusDealJobHandler(deal, status);

                if (notifications && notifications.length > 0) {
                    notifications.forEach(async notification => {
                        await Notification.create(notification);
                    });
                }

                if (smsNotifications && smsNotifications.sellerMessage) {
                    await seller.sendSmsNotification(smsNotifications.sellerMessage);
                }

                if (smsNotifications && smsNotifications.buyerMessage) {
                    await buyer.sendSmsNotification(smsNotifications.buyerMessage);
                }

                return successResponse(res, { deal, message: 'Deal updated successfully' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }
        } catch (err) {
            next(err);
        }
    },

    acceptOffer: async (req, res, next) => {
        try {
            const { user, params: { id } } = req;

            const deal = await Deal.findOne({
                '_id': id,
                $or: [
                  {
                    buyer: user.id,
                    'dealStatus.status': { $in: ['waitingBuyerToApproveOffer', 'waitingBuyerAndSellerToApproveOffer'] }
                  },
                  {
                      seller: user.id,
                      'dealStatus.status': { $in: ['waitingSellerToApproveOffer', 'waitingBuyerAndSellerToApproveOffer'] }
                  }
                ]
            });

            if (deal) {
                const buyer = await User.findById(deal.buyer);
                const seller = await User.findById(deal.seller);
                const property = await Property.findById(deal.property);
                if (deal.dealStatus.status === 'waitingBuyerAndSellerToApproveOffer') {

                    let status;
                    let messages;

                    await Deal.findOneAndUpdate({ '_id': deal.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

                    if (user.id === deal.buyer.toString()) {
                        status = getDealStatuses('waitingSellerToApproveOffer');
                    }
                    if (user.id === deal.seller.toString()) {
                        status = getDealStatuses('waitingBuyerToApproveOffer');
                    }
                    deal.dealStatus = {
                        status: status.dealStatus,
                        displayStatus: status.displayStatus,
                        expiredAt: status.expiration(),
                        repeatStatus: true
                    };

                    messages = status.acceptOfferMessages(user, deal);

                    messages.forEach((message) => {
                        deal.dialog.push(message);
                    });

                    await deal.save();

                    await statusDealJobHandler(deal, status);

                    const notifications = status.acceptOfferNotifications(buyer, seller, deal, property);

                    if (notifications && notifications.length > 0) {
                        notifications.forEach(async notification => {
                            await Notification.create(notification);
                        });
                    }

                    const smsNotifications = status.acceptOfferSmsNotifications(buyer, seller, deal, property);

                    if (smsNotifications && smsNotifications.sellerMessage) {
                        await seller.sendSmsNotification(smsNotifications.sellerMessage);
                    }

                    if (smsNotifications && smsNotifications.buyerMessage) {
                        await buyer.sendSmsNotification(smsNotifications.buyerMessage);
                    }

                } else {
                    let status;

                    await Deal.findOneAndUpdate({ '_id': deal.id }, { $unset: { 'dialog.$[].currentStatus': '' } });

                    if (user.id === deal.buyer.toString()) {
                        status = getDealStatuses('offerAcceptedByBuyer');
                        deal.finalOffer = deal.sellerOffer;

                    }
                    if (user.id === deal.seller.toString()) {
                        status = getDealStatuses('offerAcceptedBySeller');
                        deal.finalOffer = deal.buyerOffer;

                    }
                    deal.showMessagesSettings.seller.showValuationButton = false;
                    deal.showMessagesSettings.seller.showValuationQuestion = false;

                    deal.showContactDetailsSettings.showBuyerDetails = true;
                    deal.showContactDetailsSettings.showSellerDetails = true;

                    deal.dealStatus = {
                        status: status.dealStatus,
                        displayStatus: status.displayStatus,
                        expiredAt: status.expiration(),
                        repeatStatus: false
                    };

                    const messages = status.messages(buyer, seller, deal);
                    messages.forEach((message) => {
                        deal.dialog.push(message);
                    });
                    await agenda.cancel({ 'data.dealId': deal.id.toString() });

                    const nextStatus = getDealStatuses('offerAcceptedWaitingDealComplete');

                    await markDealAsCompletedJobHandler(deal, nextStatus);

                    await deal.save();

                    const notifications = status.notifications(buyer, seller, deal, property);

                    if (notifications && notifications.length > 0) {
                        notifications.forEach(async notification => {
                            await Notification.create(notification);
                        });
                    }

                    const smsNotifications = status.smsNotifications(buyer, seller, deal, property);

                    if (smsNotifications && smsNotifications.sellerMessage) {
                        await seller.sendSmsNotification(smsNotifications.sellerMessage);
                    }

                    if (smsNotifications && smsNotifications.buyerMessage) {
                        await buyer.sendSmsNotification(smsNotifications.buyerMessage);
                    }

                    const successSmsNotifications = status.successSmsNotifications(buyer, seller, deal, property);

                    if (successSmsNotifications && successSmsNotifications.sellerMessage) {
                        await seller.sendSmsNotification(successSmsNotifications.sellerMessage);
                    }

                    if (successSmsNotifications && successSmsNotifications.buyerMessage) {
                        await buyer.sendSmsNotification(successSmsNotifications.buyerMessage);
                    }
                }

                return successResponse(res, { deal, message: 'Offer accepted successfully' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }
        } catch (err) {
            next(err);
        }
    },

    markDealAsFinished: async (req, res, next) => {
        try {
            const { user, params: { id } } = req;

            const deal = await Deal.findOne({
                '_id': id,
                $or: [{
                    buyer: user.id,
                    'dealStatus.status': { $in: ['offerAcceptedBySeller', 'offerAcceptedByBuyer'] }
                },
                    {
                        seller: user.id,
                        'dealStatus.status': { $in: ['offerAcceptedBySeller', 'offerAcceptedByBuyer'] }
                    }]
            });

            if (deal) {
                const seller = await User.findById(deal.seller);
                const buyer = await User.findById(deal.buyer);
                const property = await Property.findById(deal.property);

                const status = getDealStatuses('offerAcceptedWaitingDealComplete');

                deal.dealStatus = {
                    status: status.dealSuccessStatus,
                    displayStatus: status.displayDealSuccessStatus,
                    expiredAt: status.successExpiration()
                };
                let messages = status.messages(user, deal);
                messages.forEach((message) => {
                    deal.dialog.push(message);
                });
                deal.showMessagesSettings.showDealCompletedMessage = false;
                await deal.save();

                await agenda.cancel({ 'data.dealId': deal.id.toString() });

                const notifications = status.successNotifications(buyer, seller, deal, property);

                if (notifications && notifications.length > 0) {
                    notifications.forEach(async notification => {
                        await Notification.create(notification);
                    });
                }

                await Property.findOneAndUpdate({ '_id': deal.property }, {
                    $set: {
                        status: propertyStatuses.sold
                    }
                });

                const deals = await Deal.find({
                    'property': deal.property,
                    'dealStatus.status': { $not: { $in: ['cancelledByBuyer', 'cancelledBySeller', 'dealCancelled', 'dealCompletedSuccessfully'] } }
                });

                if (deals && deals.length > 0) {

                    const status = getDealStatuses('cancelledPropertySold');

                    deals.forEach(async deal => {
                        deal.dealStatus = {
                            status: status.dealStatus,
                            displayStatus: status.displayStatus,
                            expiredAt: status.expiration()
                        };
                        const messages = status.messages(deal);
                        messages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        await deal.save();
                        const notifications = status.notifications(buyer, seller, deal, property);

                        if (notifications && notifications.length > 0) {
                            notifications.forEach(async notification => {
                                await Notification.create(notification);
                            });
                        }
                    });
                }

                return successResponse(res, { deal, message: 'Deal updated successfully' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }
        } catch (err) {
            next(err);
        }
    },
    markDealAsInProgress: async (req, res, next) => {
        try {
            const { user, params: { id }, body: { inProgressMessages } } = req;

            const deal = await Deal.findOne({
                '_id': id,
                $or: [
                  {
                    buyer: user.id,
                    'dealStatus.status': { $in: ['offerAcceptedBySeller', 'offerAcceptedByBuyer'] }
                  },
                  {
                      seller: user.id,
                      'dealStatus.status': { $in: ['offerAcceptedBySeller', 'offerAcceptedByBuyer'] }
                  }
                ]
            });

            if (deal) {

                const status = getDealStatuses('offerAcceptedWaitingDealComplete');

                let messages;

                if (inProgressMessages) {
                    messages = status.inProgressMessages(user, deal);
                } else {
                    messages = status.askMeLaterMessages(user, deal);
                }

                messages.forEach((message) => {
                    deal.dialog.push(message);
                });
                deal.showMessagesSettings.showDealCompletedMessage = false;
                await deal.save();

                await agenda.cancel({ 'data.dealId': deal.id.toString() });
                await markDealAsCompletedJobHandler(deal, status, true);

                return successResponse(res, { deal, message: 'Deal updated successfully' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }
        } catch (err) {
            next(err);

        }
    },

    refuseService: async (req, res, next) => {
        try {
            const { user, params: { id }, body: { serviceType } } = req;

            const deal = await Deal.findOne({ $or: [{ '_id': id, seller: user.id }, { '_id': id, buyer: user.id }] });
            if (deal) {
                if (user.id === deal.seller.toString()) {
                    if (serviceType === 'valuer') {

                        const status = getDealStatuses('acceptedWaitingValuation');

                        await Deal.findOneAndUpdate({ '_id': deal.id }, { $unset: { 'dialog.$[].currentStatus': '' } });
                        deal.dealStatus = {
                            status: status.dealStatus,
                            displayStatus: status.displayStatus,
                            expiredAt: status.expiration(),
                            repeatStatus: true
                        };

                        const messages = refuseMessages.sellerRefuseValuationService.messages(user, deal, status.expirationData);
                        messages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        deal.showMessagesSettings.seller.valuationQuestionTouched = true;
                        deal.showMessagesSettings.seller.showValuationQuestion = false;
                        deal.showMessagesSettings.seller.showValuationButton = true;

                        deal.showMessagesSettings.seller.showSolicitorQuestion = true;
                        deal.showMessagesSettings.seller.showSolicitorButton = true;

                        await deal.save();

                        await statusDealJobHandler(deal, status);

                        const buyer = await User.findById(deal.buyer);
                        const property = await Property.findById(deal.property);

                        const notifications = refuseMessages.sellerRefuseValuationService.notifications(buyer, user, deal, property, status.expirationData);

                        if (notifications && notifications.length > 0) {
                            notifications.forEach(async notification => {
                                await Notification.create(notification);
                            });
                        }

                    } else if (serviceType === 'solicitor') {
                        const messages = refuseMessages.sellerRefuseSolicitorService.messages(user, deal);
                        messages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        deal.showMessagesSettings.seller.solicitorQuestionTouched = true;
                        deal.showMessagesSettings.seller.showSolicitorQuestion = false;
                        deal.showMessagesSettings.seller.showSolicitorButton = true;

                        await deal.save();

                    } else {
                        return next(new APIError('Service type not supported.', 422));
                    }

                }
                if (user.id === deal.buyer.toString()) {

                    if (serviceType === 'solicitor') {
                        const messages = refuseMessages.buyerRefuseSolicitorService.messages(user);
                        messages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        deal.showMessagesSettings.buyer.solicitorButtonTouched = true;
                        deal.showMessagesSettings.buyer.showSolicitorQuestion = false;
                        deal.showMessagesSettings.buyer.showSolicitorButton = true;

                        deal.showMessagesSettings.buyer.showSurveyorQuestion = true;
                        deal.showMessagesSettings.buyer.showSurveyorButton = true;

                        await deal.save();

                    } else if (serviceType === 'surveyor') {
                        const messages = refuseMessages.buyerRefuseSurveyorService.messages(user);
                        messages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        deal.showMessagesSettings.buyer.surveyorQuestionTouched = true;
                        deal.showMessagesSettings.buyer.showSurveyorQuestion = false;
                        deal.showMessagesSettings.buyer.showSurveyorButton = true;
                        await deal.save();

                    } else {
                        return next(new APIError('Service type not supported.', 422));
                    }
                }

                return successResponse(res, { deal, message: 'Service refused' });

            } else {
                return next(new APIError('Deal not found.', 404));
            }

        } catch (err) {
            next(err);
        }
    },

    cancelDeal: async (req, res, next) => {
        try {
            const { user, params: { id }, body: { cancelReasons } } = req;

            const deal = await Deal.findOne({ $or: [{ '_id': id, seller: user.id }, { '_id': id, buyer: user.id }] });

            if (deal) {

                const seller = await User.findById(deal.seller);
                const buyer = await User.findById(deal.buyer);
                const property = await Property.findById(deal.property);
                let notifications;
                let smsNotifications;
                let status;

                if (!deal.showMessagesSettings.showDealCompletedMessage) {

                    if (user.id === deal.seller.toString()) {
                        status = getDealStatuses('cancelledBySeller');
                        if (cancelReasons) {
                            deal.cancelReasons.sellerReasons = cancelReasons;
                        }

                    }
                    if (user.id === deal.buyer.toString()) {
                        status = getDealStatuses('cancelledByBuyer');
                        if (cancelReasons) {
                            deal.cancelReasons.buyerReasons = cancelReasons;
                        }
                    }

                    deal.dealStatus = {
                        status: status.dealStatus,
                        displayStatus: status.displayStatus,
                        expiredAt: status.expiration()
                    };

                    let messages = status.messages(user, deal);
                    messages.forEach((message) => {
                        deal.dialog.push(message);
                    });

                    notifications = status.notifications(buyer, seller, deal, property);
                    smsNotifications = status.smsNotifications(buyer, seller, deal, property);

                } else {

                    status = getDealStatuses('offerAcceptedWaitingDealComplete');

                    deal.dealStatus = {
                        status: status.failDealStatus,
                        displayStatus: status.displayFailStatus,
                        expiredAt: status.failExpiration()
                    };

                    let messages = status.failMessages(user, deal);
                    messages.forEach((message) => {
                        deal.dialog.push(message);
                    });
                    deal.showMessagesSettings.showDealCompletedMessage = false;

                    notifications = status.failNotifications(buyer, seller, deal, property);

                }
                deal.showMessagesSettings.seller.showSolicitorButton = false;
                deal.showMessagesSettings.seller.showSolicitorQuestion = false;
                deal.showMessagesSettings.seller.showValuationButton = false;
                deal.showMessagesSettings.seller.showValuationQuestion = false;

                deal.showMessagesSettings.buyer.showSolicitorButton = false;
                deal.showMessagesSettings.buyer.showSolicitorQuestion = false;
                deal.showMessagesSettings.buyer.showSurveyorButton = false;
                deal.showMessagesSettings.buyer.showSurveyorQuestion = false;

                await agenda.cancel({ 'data.dealId': deal.id.toString() });
                await deal.save();

                const providerRequests = deal.providerRequests;

                if (providerRequests && providerRequests.length > 0) {

                    providerRequests.forEach(async request => {

                        const serviceRequest = await Request.findOne({
                            '_id': request.requestId,
                            'requestStatus.status': {
                                $not: {
                                    $in:
                                        ['declinedWaitingCancelRequest',
                                            'requestCancelled',
                                            'cancelledStatusExpired',
                                            'requestNotCompleted',
                                            'requestCompletedSuccessfully',
                                            'cancelledByCustomer',
                                            'cancelledByProvider'
                                        ]
                                }
                            }
                        });

                        if (serviceRequest) {
                            const provider = await User.findById(serviceRequest.bestOffer.providerId);
                            const customer = await User.findById(serviceRequest.ownerId);
                            const status = getServiceRequestStatus(serviceRequest.requestType, 'requestCancelledDealCancelled');

                            serviceRequest.requestStatus = {
                                status: status.requestStatus,
                                displayStatus: status.displayRequestStatus,
                                expiredAt: status.expiration()
                            };

                            const requestMessages = status.requestMessages(customer, provider);
                            requestMessages.forEach((message) => {
                                serviceRequest.dialog.push(message);
                            });

                            serviceRequest.showMessagesSettings.showAppointmentIsCompletedMessage = false;

                            serviceRequest.cancelReasons.providerReasons = 'Deal cancelled';

                            const notifications = status.notifications(customer, provider, serviceRequest, deal, property);

                            if (notifications && notifications.length > 0) {
                                notifications.forEach(async notification => {
                                    await Notification.create(notification);
                                });
                            }
                            await serviceRequest.save();
                            await agenda.cancel({ 'data.requestId': serviceRequest.id });
                        }
                    });
                }

                if (notifications && notifications.length > 0) {
                    notifications.forEach(async notification => {
                        await Notification.create(notification);
                    });
                }

                if (smsNotifications && smsNotifications.sellerMessage) {
                    await seller.sendSmsNotification(smsNotifications.sellerMessage);
                }

                if (smsNotifications && smsNotifications.buyerMessage) {
                    await buyer.sendSmsNotification(smsNotifications.buyerMessage);
                }

                return successResponse(res, { deal, message: 'Deal canceled successfully' });

            } else {
                return next(new APIError('Not found.', 404));
            }

        } catch (err) {
            next(err);
        }
    },
};

export default dealsController;
