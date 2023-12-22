import jwt from 'jsonwebtoken';
import User from "../db/models/user.model";
import {Request, Response, NextFunction} from "express";

const {
  JWT_SECRET: tokenSecret,
} = process.env;

// body
export const isAuth = (shouldBeAuthenticated = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return shouldBeAuthenticated ? res.sendStatus(401) : next();
      }

      const username = jwt.verify(token, tokenSecret);

      const user = await User.findOne({ where: { username } });

      if (user === null) {
        return res.status(404).send("User does not exist");
      }

      if (shouldBeAuthenticated) {
        req.user = user;

        // User.commitActivity(requester); // update the 'activeAt' field

        return next();
      } else {
        return res.sendStatus(403);
      }
    } catch (error) {
      res.sendStatus(403);

      throw error;
    }
  };
};