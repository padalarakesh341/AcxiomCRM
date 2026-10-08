const AuthService = require('../../application/authService');
const AuditService = require('../../cross-cutting/auditService');

class AuthApiController {
  static async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const ipAddress = AuditService.getClientIp(req);

      const result = await AuthService.login({ identifier, password, ipAddress });
      if (!result.success) {
        return res.status(result.isLocked ? 403 : 401).json({
          success: false,
          error: { message: result.message, isLocked: result.isLocked }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        data: {
          token: result.token,
          user: result.user
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res) {
    const { password_hash, ...safeUser } = req.user;
    return res.status(200).json({
      success: true,
      data: { user: safeUser }
    });
  }
}

module.exports = AuthApiController;
