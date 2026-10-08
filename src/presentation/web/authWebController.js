const AuthService = require('../../application/authService');
const AuditService = require('../../cross-cutting/auditService');

class AuthWebController {
  static showLogin(req, res) {
    if (req.session && req.session.user) {
      return res.redirect('/dashboard');
    }
    return res.render('auth/login', {
      title: 'Sign In - AcxiomCRM',
      layout: false,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static async postLogin(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const ipAddress = AuditService.getClientIp(req);

      const result = await AuthService.login({ identifier, password, ipAddress });

      if (!result.success) {
        req.flash('error', result.message);
        return res.redirect('/auth/login');
      }

      // Store in session
      req.session.user = result.user;
      const redirectUrl = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;

      req.flash('success', `Welcome back, ${result.user.full_name}!`);
      return res.redirect(redirectUrl);
    } catch (err) {
      next(err);
    }
  }

  static postLogout(req, res) {
    const user = req.session?.user;
    const ipAddress = AuditService.getClientIp(req);
    AuthService.logout({ user, ipAddress });

    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  }

  static showProfile(req, res) {
    return res.render('auth/profile', {
      title: 'My Profile',
      currentUser: req.session.user,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static async postChangePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const ipAddress = AuditService.getClientIp(req);

      if (newPassword !== confirmPassword) {
        req.flash('error', 'New password and confirm password do not match.');
        return res.redirect('/profile');
      }

      const result = await AuthService.changePassword({
        userId: req.session.user.id,
        currentPassword,
        newPassword,
        ipAddress
      });

      if (!result.success) {
        req.flash('error', result.message);
        return res.redirect('/profile');
      }

      req.flash('success', 'Password successfully updated.');
      return res.redirect('/profile');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthWebController;
