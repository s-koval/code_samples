import passport from 'passport';
import { errorResponse } from '../utils/response';
import APIError from '../utils/error';

export const loginGuard = () => (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err || !user) {
            const message = info ? info.message : 'Login failed';

            return errorResponse(res, new APIError(message, 400));
        }

        req.user = user;

        next();
    })(req, res, next);
};

export const accessGuard = () => (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err || !user) {
            const message = info ? info.message : 'Forbidden';
            const code = info && info.expiredAt ? 401 : 403;

            return errorResponse(res, new APIError(message, code));
        }

        req.user = user;

        next();
    })(req, res, next);
};

export const adminGuard = () => (req, res, next) => {

    if (!req.user.isAdmin()) {
        const message =  'Forbidden';
        const code =  403;

        return errorResponse(res, new APIError(message, code));
    }

    next();

};