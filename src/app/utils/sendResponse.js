
export const sendResponse = (res, data) => {
    res.status(data.statusCode).json({
        statusCode: data.statusCode,
        success: data.success,
        meta: data.meta,
        data: data.data,
        message: data.message
    })
}