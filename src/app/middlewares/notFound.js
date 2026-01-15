import httpStatus from 'http-status-codes'

export const notFound = (req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "Route Not Found"
  })
}