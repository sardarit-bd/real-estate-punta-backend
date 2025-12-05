class AppError extends Error {
    constructor(statusCode, message, stack = '') {
        super(message);
        this.statusCode = statusCode;

        if (stack) {
            this.stack = stack;
        } else {
            // capture the correct stack trace
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export default AppError