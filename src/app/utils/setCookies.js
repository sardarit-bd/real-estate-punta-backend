import { envVars } from "../config/env.js"

export const setAuthCookie = (res, tokenInfo) => {
    if (tokenInfo.accessToken) {
        res.cookie('accessToken', tokenInfo.accessToken, {
            httpOnly: true,
            secure: envVars.ENVAIRONMENT === 'production', 
            sameSite: envVars.ENVAIRONMENT === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, 
            path: '/',
        })
    }

    if (tokenInfo.refreshToken) {
        res.cookie('refreshToken', tokenInfo.refreshToken, {
           httpOnly: true,
            secure: envVars.ENVAIRONMENT === 'production', 
            sameSite: envVars.ENVAIRONMENT === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, 
            path: '/',
        })
    }
}
