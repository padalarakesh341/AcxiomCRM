const UserService = require('../../application/userService');
const AuditService = require('../../cross-cutting/auditService');

class UserWebController {
  static list(req, res, next) {
    try {
      const { search = '', roleId = '', isActive = '' } = req.query;
      const users = UserService.listUsers({ search, roleId, isActive });
      const roles = UserService.getRoles();

      return res.render('users/index', {
        title: 'User & Role Administration',
        currentUser: req.session.user,
        users,
        roles,
        search,
        roleId,
        isActive,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static showCreateForm(req, res) {
    const roles = UserService.getRoles();
    return res.render('users/form', {
      title: 'Create New User',
      currentUser: req.session.user,
      user: {},
      roles,
      isEdit: false,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static async create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = await UserService.createUser(req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect('/users/new');
      }

      req.flash('success', `User "${result.user.username}" created successfully.`);
      return res.redirect('/users');
    } catch (err) {
      next(err);
    }
  }

  static showEditForm(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = UserService.getUserById(id);
      if (!user) {
        req.flash('error', 'User not found.');
        return res.redirect('/users');
      }

      const roles = UserService.getRoles();
      return res.render('users/form', {
        title: `Edit User - ${user.username}`,
        currentUser: req.session.user,
        user,
        roles,
        isEdit: true,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = UserService.updateUser(id, req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect(`/users/${id}/edit`);
      }

      req.flash('success', 'User updated successfully.');
      return res.redirect('/users');
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { newPassword } = req.body;
      const ipAddress = AuditService.getClientIp(req);
      const result = await UserService.resetUserPassword(id, newPassword, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', result.message);
      }

      return res.redirect('/users');
    } catch (err) {
      next(err);
    }
  }

  static unlock(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = UserService.unlockUser(id, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', result.message);
      }

      return res.redirect('/users');
    } catch (err) {
      next(err);
    }
  }

  static toggleStatus(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { isActive } = req.body;
      const ipAddress = AuditService.getClientIp(req);
      const result = UserService.toggleActive(id, isActive === '1', req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', 'User active status updated.');
      }

      return res.redirect('/users');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserWebController;
