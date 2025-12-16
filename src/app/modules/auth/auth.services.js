import AppError from "../../errorHelpers/AppError.js";

import httpStatus from 'http-status-codes'
import bcryptjs from "bcryptjs";
import { createUserTokens } from "../../utils/userTokens.js";
import { User } from "./auth.model.js";
import { envVars } from "../../config/env.js";
import { sendResetPasswordEmail } from "../../utils/sendEmail.js";
import jwt from 'jsonwebtoken'

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

  const isUserExist = await User.findOne({ email: email });

  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
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



export const changePassword = async (payload, decodedToken) => {

  const newPassword = payload.newPassword;
  const oldPassword = payload.oldPassword;

  const user = await User.findById(decodedToken.userId);

  const isOldPasswordMatched = await bcryptjs.compare(
    oldPassword,
    user?.password
  );


  if (!isOldPasswordMatched) {
    throw new AppError(httpStatus.BAD_REQUEST, "Old Password does not matched!")
  }

  user.password = await bcryptjs.hash(
    newPassword,
    Number(10)
  );
  user.save();

  return true
}



export const forgotPassword = async (payload) => {
  const { email } = payload;
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Use does not found.")
  }

  const JwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const resetToken = jwt.sign(JwtPayload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });


  const resetUrlLink = `${envVars.FRONTEND_URL}/reset-password?id=${user._id}&token=${resetToken}`;
  console.log(resetUrlLink)
  sendResetPasswordEmail(user.email, resetUrlLink);
  console.log("done")
  return true
}


export const resetPassword = async (payload, decodedToken) => {
  const { password } = payload;
 
  const user = await User.findById(decodedToken.userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Use does not found.")
  }

  user.password = await bcryptjs.hash(
    password,
    Number(10)
  );
  user.save();
  return true
}

export const AuthServices = {
  credentialsLogin,
  createUser,
  getMe,
  changePassword,
  resetPassword,
  forgotPassword
}