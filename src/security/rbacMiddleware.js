function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const isApi = req.originalUrl.startsWith('/api');
    const user = isApi ? req.user : req.session?.user;

    if (!user) {
      if (isApi) {
        return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
      }
      return res.redirect('/auth/login');
    }

    const userRole = user.role_name || user.role;
    if (!allowedRoles.includes(userRole)) {
      if (isApi) {
        return res.status(403).json({
          success: false,
          error: { message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}].` }
        });
      }
      const err = new Error('You do not have permission to access this resource.');
      err.status = 403;
      return next(err);
    }

    next();
  };
}

module.exports = {
  requireRole,
  requireAdmin: requireRole(['Admin']),
  requireManagerOrAdmin: requireRole(['Admin', 'Manager'])
};
