
export const handleDuplicateError = (err) => {
  const matchedArray = err.message.match(/"([^"]*)"/);

  return {
    statusCode: 400,
    message: `${matchedArray[1]} is already exist`,
  };
};