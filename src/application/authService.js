const bcrypt = require('bcryptjs');
const UserRepository = require('../data-access/userRepository');
const { validatePassword } = require('../domain/passwordPolicy');
const { isAccountLocked, calculateNewLockoutState } = require('../domain/lockoutPolicy');
const TokenService = require('../security/tokenService');
const AuditService = require('../cross-cutting/auditService');

class AuthService {
  static async login({ identifier, password, ipAddress = '127.0.0.1' }) {
    if (!identifier || !password) {
      return { success: false, message: 'Username/Email and Password are required.' };
    }

    // Find user by email or username
    let user = UserRepository.findByEmail(identifier);
    if (!user) {
      user = UserRepository.findByUsername(identifier);
    }

    if (!user) {
      AuditService.log({
        username: identifier,
        role: 'Unknown',
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        details: 'User not found',
        ipAddress,
        result: 'FAILURE'
      });
      return { success: false, message: 'Invalid credentials.' };
    }

    if (!user.is_active) {
      AuditService.log({
        userId: user.id,
        username: user.username,
        role: user.role_name,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        details: 'Account is deactivated',
        ipAddress,
        result: 'FAILURE'
      });
      return { success: false, message: 'Your account has been deactivated. Please contact an administrator.' };
    }

    // Check lockout policy
    const lockoutStatus = isAccountLocked(user);
    if (lockoutStatus.locked) {
      AuditService.log({
        userId: user.id,
        username: user.username,
        role: user.role_name,
        action: 'LOGIN_LOCKED',
        module: 'AUTH',
        details: `Account locked. Remaining minutes: ${lockoutStatus.remainingMinutes}`,
        ipAddress,
        result: 'FAILURE'
      });
      return {
        success: false,
        isLocked: true,
        message: `Account is temporarily locked due to repeated failed login attempts. Try again in ${lockoutStatus.remainingMinutes} minute(s) or contact an administrator.`
      };
    }

    // Verify password hash
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      const newLockout = calculateNewLockoutState(user.failed_login_attempts);
      UserRepository.updateLockout(user.id, {
        failedAttempts: newLockout.failedAttempts,
        lockedUntil: newLockout.lockedUntil
      });

      AuditService.log({
        userId: user.id,
        username: user.username,
        role: user.role_name,
        action: newLockout.isNowLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        module: 'AUTH',
        details: newLockout.isNowLocked 
          ? `Account locked after ${newLockout.failedAttempts} failed attempts`
          : `Invalid password. Failed attempt #${newLockout.failedAttempts}`,
        ipAddress,
        result: 'FAILURE'
      });

      if (newLockout.isNowLocked) {
        return {
          success: false,
          isLocked: true,
          message: 'Account has been locked due to 5 failed login attempts. Please wait 15 minutes or contact an administrator.'
        };
      }

      return {
        success: false,
        message: `Invalid credentials. Attempt ${newLockout.failedAttempts} of 5 before account lockout.`
      };
    }

    // Success - reset attempts and update login time
    UserRepository.recordSuccessfulLogin(user.id);
    const token = TokenService.generateToken(user);

    AuditService.log({
      userId: user.id,
      username: user.username,
      role: user.role_name,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      details: 'User authenticated successfully',
      ipAddress,
      result: 'SUCCESS'
    });

    // Remove password hash from returned object (DTO pattern)
    const { password_hash, ...safeUser } = user;

    return {
      success: true,
      user: safeUser,
      token
    };
  }

  static logout({ user, ipAddress = '127.0.0.1' }) {
    if (user) {
      AuditService.log({
        userId: user.id,
        username: user.username,
        role: user.role_name || user.role,
        action: 'LOGOUT',
        module: 'AUTH',
        details: 'User logged out',
        ipAddress,
        result: 'SUCCESS'
      });
    }
    return { success: true };
  }

  static async changePassword({ userId, currentPassword, newPassword, ipAddress = '127.0.0.1' }) {
    const user = UserRepository.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    const policy = validatePassword(newPassword);
    if (!policy.valid) {
      return { success: false, message: policy.errors.join(' ') };
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);
    UserRepository.updatePassword(userId, newHash);

    AuditService.log({
      userId: user.id,
      username: user.username,
      role: user.role_name,
      action: 'PASSWORD_CHANGE',
      module: 'AUTH',
      details: 'User updated their password',
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, message: 'Password changed successfully.' };
  }
}

module.exports = AuthService;
