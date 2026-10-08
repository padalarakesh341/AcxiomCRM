const logger = require('./logger');

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  const isApi = req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json');
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (isApi) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }

  // Web rendering
  if (statusCode === 403) {
    return res.status(403).render('errors/403', {
      title: 'Access Forbidden',
      message: 'You do not have permission to access this resource.',
      currentUser: req.session?.user || null
    });
  }

  if (statusCode === 404) {
    return res.status(404).render('errors/404', {
      title: 'Page Not Found',
      message: 'The requested page could not be found.',
      currentUser: req.session?.user || null
    });
  }

  return res.status(statusCode).render('errors/500', {
    title: 'Server Error',
    message,
    currentUser: req.session?.user || null
  });
}

module.exports = errorHandler;
