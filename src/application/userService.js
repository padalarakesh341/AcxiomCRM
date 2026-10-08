const bcrypt = require('bcryptjs');
const UserRepository = require('../data-access/userRepository');
const AuditService = require('../cross-cutting/auditService');
const { validatePassword } = require('../domain/passwordPolicy');

class UserService {
  static listUsers(filters = {}) {
    return UserRepository.findAll(filters);
  }

  static getUserById(id) {
    const user = UserRepository.findById(id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  static getRoles() {
    return UserRepository.getAllRoles();
  }

  static getSalesExecutives() {
    return UserRepository.getSalesExecutives();
  }

  static async createUser(data, currentUser, ipAddress = '127.0.0.1') {
    const errors = [];

    if (!data.username || data.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters.');
    } else {
      const existingUser = UserRepository.findByUsername(data.username.trim());
      if (existingUser) {
        errors.push(`Username "${data.username}" is already taken.`);
      }
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('A valid email address is required.');
    } else {
      const existingEmail = UserRepository.findByEmail(data.email.trim());
      if (existingEmail) {
        errors.push(`Email "${data.email}" is already registered.`);
      }
    }

    if (!data.fullName || data.fullName.trim().length === 0) {
      errors.push('Full name is required.');
    }

    if (!data.roleId) {
      errors.push('Role assignment is required.');
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = UserRepository.create({
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash,
      roleId: parseInt(data.roleId, 10),
      fullName: data.fullName.trim(),
      phone: data.phone ? data.phone.trim() : null
    });

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'USER_CREATED',
      module: 'USER',
      recordId: user.id,
      details: `Created user ${user.username} with role ${user.role_name}`,
      ipAddress,
      result: 'SUCCESS'
    });

    const { password_hash, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  static updateUser(id, data, currentUser, ipAddress = '127.0.0.1') {
    const existing = UserRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['User not found.'] };
    }

    const errors = [];
    if (!data.fullName || data.fullName.trim().length === 0) {
      errors.push('Full name is required.');
    }
    if (!data.roleId) {
      errors.push('Role assignment is required.');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const updated = UserRepository.update(id, {
      fullName: data.fullName.trim(),
      phone: data.phone ? data.phone.trim() : null,
      roleId: parseInt(data.roleId, 10),
      isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active
    });

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'USER_UPDATED',
      module: 'USER',
      recordId: id,
      details: `Updated user ${updated.username} details`,
      ipAddress,
      result: 'SUCCESS'
    });

    const { password_hash, ...safeUser } = updated;
    return { success: true, user: safeUser };
  }

  static async resetUserPassword(id, newPassword, currentUser, ipAddress = '127.0.0.1') {
    const existing = UserRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['User not found.'] };
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, errors: passwordValidation.errors };
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    UserRepository.updatePassword(id, passwordHash);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'ADMIN_PASSWORD_RESET',
      module: 'USER',
      recordId: id,
      details: `Admin reset password for user ${existing.username}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, message: 'Password has been reset successfully.' };
  }

  static unlockUser(id, currentUser, ipAddress = '127.0.0.1') {
    const existing = UserRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['User not found.'] };
    }

    UserRepository.resetLockout(id);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'ACCOUNT_UNLOCKED',
      module: 'USER',
      recordId: id,
      details: `Admin unlocked account for user ${existing.username}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, message: 'User account has been unlocked.' };
  }

  static toggleActive(id, isActive, currentUser, ipAddress = '127.0.0.1') {
    const existing = UserRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['User not found.'] };
    }

    if (existing.id === currentUser.id && !isActive) {
      return { success: false, errors: ['You cannot deactivate your own administrative account.'] };
    }

    UserRepository.update(id, {
      fullName: existing.full_name,
      phone: existing.phone,
      roleId: existing.role_id,
      isActive: isActive ? 1 : 0
    });

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      module: 'USER',
      recordId: id,
      details: `Admin toggled user ${existing.username} status to ${isActive ? 'Active' : 'Inactive'}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }
}

module.exports = UserService;
