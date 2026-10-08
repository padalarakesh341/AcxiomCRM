const crypto = require('crypto');

/**
 * Lightweight Robust Anti-Forgery (CSRF) Protection Middleware
 */
function antiForgeryMiddleware(req, res, next) {
  if (!req.session) {
    return next();
  }

  // Ensure CSRF secret/token exists in session
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }

  // Make available to templates and responses
  res.locals.csrfToken = req.session.csrfToken;

  // Only protect state-changing requests that are NOT api endpoints
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }

  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  if (!isStateChanging) {
    return next();
  }

  // Check token in body, headers, or query
  const submittedToken = req.body?._csrf || req.headers['x-csrf-token'] || req.query?._csrf;

  if (!submittedToken || submittedToken !== req.session.csrfToken) {
    const err = new Error('Invalid or missing anti-forgery CSRF token. Please refresh the page and try again.');
    err.status = 403;
    return next(err);
  }

  next();
}

module.exports = antiForgeryMiddleware;
