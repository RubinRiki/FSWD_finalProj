function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const body = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    body.trace = err.stack;
  }
  console.error(err);
  res.status(status).json(body);
}
module.exports = errorHandler;
