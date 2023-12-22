import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models';
import config from '../config';


const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: config.JWT_SECRET,
    passReqToCallback: true
};

const JWTStrategy = new Strategy(options, async (req, payload, next) => {
    try {
        const token = options.jwtFromRequest(req);
        const user = await User.findById(payload.id);

        if (!user.loginHistory.find(loginData => loginData.token === token && loginData.status)) {
            next('Fail');
        }

        if (user && !await user.emailIsConfirmed()) {
            return next(null, false, { message: 'Please verify your email' });
        }

        next(null, user);
    }
    catch (err) {
        next(err);
    }
});


export default JWTStrategy;