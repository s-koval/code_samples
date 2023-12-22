import User from '../../models/User';
import { successResponse } from '../../utils/response';
import { errorMessages, successMessages } from '../../constants/responseMessages';
import { accountTypes } from '../../constants/userConstants';
import APIError from '../../utils/error';
import { Deal, Property } from '../../models';
import { s3RemoveFile } from '../../utils/aws';
import { getRequestData } from '../../utils/getRequestData';
import moment from 'moment';
import uploadUserDocuments from '../../utils/uploadUserDocuments';
import getDealStatuses from '../../constants/getDealStatuses';
import config from '../../config';
import agenda from '../../utils/agenda';
import { capitalize } from 'lodash';


const crypto = require('crypto');

const authController = {
    getMe: async ({ user }, res) => successResponse(res, {
        user
    }),

    login: async (req, res) => {
        const { user } = req;
        const token = await user.getToken();
        const loginHistory = {
            ...await getRequestData(req),
            loginAt:moment().format(),
            expiredAt: moment().add(config.JWT_EXPIRES_IN, 'ms').format('x'),
            token
        };

        await user.updateOne({ loginHistory: [...user.loginHistory, loginHistory] });

        return successResponse(res, {
            token,
            user
        });
    },

    logout: async (req, res) => {
        const { user } = req;
        const header = req.headers['authorization'];
        const bearer = header.split(' ');
        const token = bearer[1];

        await User.findOneAndUpdate({ '_id': user.id, 'loginHistory.token': token },
            {
                $set: {
                    'loginHistory.$.status': false,
                    'loginHistory.$.token': null
                }
            });
        return successResponse(res);
    },

    deviceLogout: async (req, res) => {
        const { user } = req;
        const { tokenId } = req.body;

        await User.findOneAndUpdate({ '_id': user.id, 'loginHistory._id': tokenId },
            {
                $set: {
                    'loginHistory.$.status': false,
                    'loginHistory.$.token': null
                }
            });
        return successResponse(res);
    },

    register: async (req, res, next) => {
        try {
            const data = JSON.parse(req.body.data);
            const { email, password, phone, name, birthday, address, respondingKey, accountType, preferredCities, territories, companyName } = data;
            let deal;
            let account;

            const capitalizedName = {

                first: capitalize(name.first),
                last: capitalize(name.last),
            };

            if (respondingKey) {

                deal = await Deal.findOne({
                    'respondingKey.key': respondingKey,
                    'respondingKey.expiredAt': { $gte: Date.now() }
                });

                if (!deal) {
                    return next(new APIError(errorMessages.invalidResponseKey, 422));
                }
            }

            if (accountType === accountTypes.customer) {
                account = {
                    accountType: accountType,
                };

            } else {
                account = {
                    accountType: accountType,
                    companyName:companyName,
                    territories: territories,
                    preferredCities: preferredCities,
                    documents: []
                };
            }

            let user = await User.create({
                email,
                password,
                phone,
                name: capitalizedName,
                birthday,
                address,
                accountType,
                companyName,
                accounts: [{ account }]
            });

            const userAccount = user.accounts[0];
            const uploadDocuments = req.files;
            const documents = [];
            const uploadedDocuments = [];
            const promises = [];

            uploadDocuments.map((file) => promises.push(uploadUserDocuments(file, documents, uploadedDocuments)));

            Promise.all(promises)
                .then(async () => {

                    const user = await User.findOneAndUpdate({ 'accounts._id': userAccount._id },
                        {
                            $push: {
                                'accounts.$.account.documents': documents
                            }
                        }, { new: true });

                    if (deal) {
                        const property = await Property.findOne(deal.property);
                        property.seller = user.id;
                        property.status = 'active';

                        await agenda.cancel({ 'data.propertyId': property.id.toString() });
                        await property.save();

                        const status = getDealStatuses('waitingSellerPropertyNotListed');
                        const buyer = await User.findById(deal.buyer);

                        const sellerMessages = status.sellerMessages(user, deal, buyer);

                        sellerMessages.forEach((message) => {
                            deal.dialog.push(message);
                        });
                        deal.seller = user.id;

                        deal.respondingKey.key = null;
                        deal.respondingKey.expiredAt = null;
                        await deal.save();

                        user.registerWithKey = true;
                    }

                    user.emailVerificationData.code = await crypto.randomBytes(20).toString('hex');
                    user.emailVerificationData.isFirstVerification = true;
                    await user.save();

                    await user.sendRegistrationConfirmationEmail();

                    return successResponse(res, {
                        message: 'Account created successfully'
                    });
                })
                .catch(async () => {
                    uploadedDocuments.forEach(async (document) => {
                        await s3RemoveFile(document.s3Key);
                    });

                    await User.findOneAndDelete(user.id);

                    return next(new APIError(errorMessages.registrationFailed, 422));
                });
        } catch (err) {
            next(err);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await User.findByEmail(email);
            if (user) {
                user.resetPasswordToken = await crypto.randomBytes(20).toString('hex');
                user.resetPasswordExpires = Date.now() + 600000;
                await user.save();

                await user.sendResetPasswordEmail();

                return successResponse(res, { message: successMessages.pwdLink });
            } else {
                next(new APIError(errorMessages.userNotFound, 404));
            }
        } catch (err) {
            next(err);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { newPassword, resetPasswordToken } = req.body;
            const user = await User.findOne({
                resetPasswordToken: resetPasswordToken,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            });

            if (user) {
                user.password = newPassword;
                user.resetPasswordToken = null;
                user.resetPasswordExpires = null;
                await user.save();
                return successResponse(res, {
                    message: successMessages.pwdUpdated,
                    user
                });
            } else {
                next(new APIError(errorMessages.codeInvalid, 422));
            }
        } catch (err) {
            next(err);
        }
    },

    getLoginHistory: async (req, res, next) => {
        try {
            const { user: { id } } = req;

            const date1 = Number(moment().format('x'));
            const date2 = moment().subtract(15, 'd');

            await User.findOneAndUpdate(
                { '_id': id },
                { $set: { 'loginHistory.$[item].status': false, 'loginHistory.$[item].token': null } },
                {
                    arrayFilters: [{ 'item.expiredAt': { $lt: date1 } }],
                    multi: true,
                });
            const user = await User.findOneAndUpdate(
                { '_id': id },
                { $pull: { loginHistory: { loginAt: { $lt: date2 } } } },
                { multi: true, new: true });

            const history = user.loginHistory;

            return successResponse(res, { history });
        } catch (err) {
            next(err);
        }
    },

    verifyEmailSendCode: async (req, res, next) => {
        try {
            const { body: { email } } = req;

            const user = await User.findByEmail(email);

            if (user) {
                user.emailVerificationData.code = await crypto.randomBytes(20).toString('hex');

                await user.save();

                if (user.emailVerificationData.isFirstVerification) {
                    await user.sendRegistrationConfirmationEmail();
                } else {
                    await user.sendEmailConfirmationEmail();
                }

                return successResponse(res, { message: 'Verification code was send successfully' });
            } else {
                next(new APIError(errorMessages.userNotFound, 404));
            }
        } catch (err) {
            next(err);
        }
    },

    verifyEmailCheckCode: async (req, res, next) => {
        try {
            const { body: { code } } = req;

            const user = await User.findOne({
                'emailVerificationData.code': code,
            });
            if (user) {
                user.emailVerificationData.code = null;
                user.emailVerification.isChecked = true;
                if (user.emailVerificationData.isFirstVerification) {
                    user.emailVerificationData.isFirstVerification = false;

                    await user.sendWelcomeEmail();

                }
                await user.save();
                return successResponse(res, {
                    message: 'Email confirmed successfully',
                });
            } else {
                next(new APIError('Code invalid', 422));
            }
        } catch (err) {
            next(err);
        }
    },
};

export default authController;
