export function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File upload exceeds maximum allowed size of 10MB.'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : message
  });
}

export default errorHandler;
