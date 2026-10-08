const TokenService = require('./tokenService');
const UserRepository = require('../data-access/userRepository');

function requireWebAuth(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.currentUser = req.session.user;
    return next();
  }

  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to continue.');
  return res.redirect('/auth/login');
}

function requireApiAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required. Missing or invalid Bearer token.' }
    });
  }

  const token = authHeader.substring(7);
  const payload = TokenService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token.' }
    });
  }

  const user = UserRepository.findById(payload.id);
  if (!user || !user.is_active) {
    return res.status(401).json({
      success: false,
      error: { message: 'User account is deactivated or no longer exists.' }
    });
  }

  req.user = user;
  next();
}

module.exports = {
  requireWebAuth,
  requireApiAuth
};
