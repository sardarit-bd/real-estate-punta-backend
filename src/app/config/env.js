import dotenv from "dotenv";
dotenv.config();

export const envVars = {
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND,

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES,

    DB_URL: process.env.DB_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,

    ENVAIRONMENT: process.env.ENVAIRONMENT,
    PORT: process.env.PORT || 3000,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL,
    STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL,



}
