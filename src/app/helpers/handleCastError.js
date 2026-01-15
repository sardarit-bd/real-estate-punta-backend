import mongoose from "mongoose";


export const handleCastError = (err) => {
  console.log(err);
  return {
    statusCode: 400,
    message: "Invalid MongoDB Object Id",
  };
};