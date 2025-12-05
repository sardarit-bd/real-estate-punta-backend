import AppError from "../errorHelpers/AppError.js";
import { verifyToken } from "../utils/jwt.js";
import { envVars } from "../config/env.js";

import httpStatus from "http-status-codes";
import { User } from "../modules/auth/auth.model.js";


export const checkAuth =
  (...roles) =>
  async (req, res, next ) => {
    try {
      console.log(req.headers, req.cookies);
      const accessToken = req.headers.authorization || req.cookies.accessToken;

      if (!accessToken) {
        throw new AppError(403, "Missing Access Token");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      );

      if (!verifiedToken) {
        throw new AppError(403, "You are not authorized");
      }

      const isUserExist = await User.findOne({ email: verifiedToken.email });

      if (!isUserExist) {
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
      }

      
      if (!roles.includes(verifiedToken.role)) {
        throw new AppError(403, "You are not permitted to this route!!!");
      }


      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };