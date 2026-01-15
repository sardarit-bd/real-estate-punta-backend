
import { envVars } from "../config/env.js";

import { handleDuplicateError } from "../helpers/handleDuplicateError.js";
import { handleCastError } from "../helpers/handleCastError.js";
import { handleValidationError } from "../helpers/handleValidationError.js";
import AppError from "../errorHelpers/AppError.js";





export const globalErrorHandle = async(
  err,
  req,
  res,
  next
) => {
  if(envVars.ENVAIRONMENT === 'development'){
    console.log(err)
  }
  
  let statusCode = 500;
  let message = `Something wen wrong!! ${err.message}`;
  let errorsSource= [];

  // duplicate error
  if (err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;

    // Object Id / mongoose id
  } else if (err.name === "CastError") {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;

    // Zod Validation Error
//   } else if (err.name === "ZodError") {
//     const simplifiedError = handleZodError(err)

//     message = simplifiedError.message;
//     statusCode = simplifiedError.statusCode;
//     errorsSource = simplifiedError.errorSources

    // mongoose validation error
  } else if (err.name == "ValidationError") {
    const simplifiedError = handleValidationError(err)
    message = simplifiedError.message
    statusCode = simplifiedError.statusCode
    errorsSource = simplifiedError.errorSources


  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorsSource,
    err: envVars.ENVAIRONMENT === 'development' ? err : null,
    stack: envVars.ENVAIRONMENT === "development" ? err.stack : null,
  });
};