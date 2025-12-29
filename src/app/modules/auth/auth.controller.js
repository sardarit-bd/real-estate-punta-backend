/* eslint-disable @typescript-eslint/no-unused-vars */
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import httpStatus from "http-status-codes";
import { AuthServices } from "./auth.services.js";
import { setAuthCookie } from "../../utils/setCookies.js";
import { envVars } from "../../config/env.js";

const createUser = catchAsync(
    async (req, res, next) => {
        const user = await AuthServices.createUser(req.body);

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "User Created Successfully",
            data: user,
        });
    }
);

const getMe = catchAsync(
    async (req, res, next) => {
        const verifiedToken = req.user;

        const user = await AuthServices.getMe(verifiedToken.userId);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "User fetched Successfully",
            data: user,
        });
    }
);

const updateMe = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const updatedUser = await AuthServices.updateMe(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});


const deleteMe = catchAsync(
    async (req, res, next) => {
        const verifiedToken = req.user;

        const user = await AuthServices.deleteMe(verifiedToken.userId);

        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: envVars.ENVAIRONMENT === 'production',
            sameSite: envVars.ENVAIRONMENT === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/',
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: envVars.ENVAIRONMENT === 'production',
            sameSite: envVars.ENVAIRONMENT === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/',
        });

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "User deleted Successfully",
            data: user,
        });
    }
);

const credentialsLogin = catchAsync(
    async (req, res, next) => {
        const loginInfo = await AuthServices.credentialsLogin(req.body)
        setAuthCookie(res, loginInfo)
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User Logged In Successfully!",
            data: loginInfo
        })

    }
);

const logout = catchAsync(
    async (req, res, next) => {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: envVars.ENVAIRONMENT === 'production',
            sameSite: envVars.ENVAIRONMENT === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/',
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: envVars.ENVAIRONMENT === 'production',
            sameSite: envVars.ENVAIRONMENT === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/',
        });
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User Logged Out Successfully!",
            data: null,
        });
    }
);


const changePassword = catchAsync(
    async (req, res, next) => {
        const decodedToken = req.user;
        await AuthServices.changePassword(req.body, decodedToken)

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Password is changed Successfully!",
            data: null
        })

    }
);


const forgotPassword = catchAsync(
    async (req, res, next) => {
        await AuthServices.forgotPassword(req.body)

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Password reset link is send to your email.",
            data: null
        })

    }
);

const resetPassword = catchAsync(
    async (req, res, next) => {
        await AuthServices.resetPassword(req.body, req.user)

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Password reset is successull.",
            data: null
        })
    }
);

export const AuthControllers = {
    credentialsLogin,
    logout,
    createUser,
    getMe,
    updateMe,
    changePassword,
    forgotPassword,
    resetPassword,
    deleteMe
};