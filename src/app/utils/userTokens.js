
import { envVars } from "../config/env.js";
import { generateToken, verifyToken } from "./jwt.js";
import AppError from "../errorHelpers/AppError.js";
import httpStatus from 'http-status-codes'
import { User } from "../modules/auth/auth.model.js";

export const createUserTokens = (user) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );
  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES
  );

  return {
    accessToken,
    refreshToken
  }
};

export const createNewAccessTokenWithRefreshToken = async (refreshToken) => {
    const verifiedRefreshToke = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET)

    const isUserExist = await User.findOne({email: verifiedRefreshToke.email})

    if(!isUserExist){
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist")
    }

    
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }

    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    return accessToken
}