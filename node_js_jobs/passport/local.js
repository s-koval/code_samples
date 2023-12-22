import { Strategy } from 'passport-local';
import { User } from '../models/';


const options = {
    usernameField: 'email',
    passwordField: 'password'
};

const LocalStrategy = new Strategy(options, async (email, password, next) => {
    try {
        const user = await User.findByEmail(email);

        if (!user || !await user.verifyPassword(password)) {
            return next(null, false, { message: `Invalid ${ options.usernameField } or ${ options.passwordField }` });
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


export default LocalStrategy;