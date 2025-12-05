/* eslint-disable @typescript-eslint/no-unused-vars */
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import httpStatus from "http-status-codes";
import { AuthServices } from "./auth.services.js";
import { setAuthCookie } from "../../utils/setCookies.js";

const createUser = catchAsync(
    async (req, res, next) => {
        const user = await UserServices.createUser(req.body);

        sendResponse < IUser > (res, {
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

        const user = (await UserServices.getMe(verifiedToken.userId));

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "User Updated Successfully",
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
            secure: false,
            sameSite: "lax",
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User Logged Out Successfully!",
            data: null,
        });
    }
);


export const AuthControllers = {
    credentialsLogin,
    logout,
    createUser,
    getMe
};