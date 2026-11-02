// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, error: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
