import AppError from "../../errorHelpers/AppError.js";

import httpStatus from 'http-status-codes'
import bcryptjs from "bcryptjs";
import { createUserTokens } from "../../utils/userTokens.js";
import { User } from "./auth.model.js";

const createUser = async (payload) => {
    const { email, password, ...rest } = payload;

    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
    }
    const hashPassword = await bcryptjs.hash(
        password,
        Number(envVars.BCRYPT_SALT_ROUND)
    )

    const user = await User.create({
        email,
        password: hashPassword,
        ...rest,
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
};
const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  return user;
};
const credentialsLogin = async (payload) => {
  const { email, password } = payload;

  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email does not exist");
  }

  const isPasswordMatched = await bcryptjs.compare(
    password,
    isUserExist.password
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.BAD_REQUEST, "Incorrect Password");
  }

  const { accessToken, refreshToken } = createUserTokens(isUserExist);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: pass, ...rest } = isUserExist.toObject();
  return {
    accessToken,
    refreshToken,
    user: rest,
  };
};


export const AuthServices = {
    credentialsLogin,
    createUser,
    getMe
}