const config = require('../config');

/**
 * AcxiomCRM Account Lockout Policy
 * - After repeated failed login attempts (default: 5), lock the account for 15 minutes.
 * - Reset counter upon successful login.
 * - Admin can manually unlock account at any time.
 */

function isAccountLocked(user) {
  if (!user || !user.locked_until) {
    return { locked: false, remainingMinutes: 0 };
  }

  const now = new Date();
  const lockExpiry = new Date(user.locked_until);

  if (now < lockExpiry) {
    const diffMs = lockExpiry.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(diffMs / (1000 * 60));
    return { locked: true, remainingMinutes };
  }

  return { locked: false, remainingMinutes: 0 };
}

function calculateNewLockoutState(currentFailedAttempts) {
  const newCount = (currentFailedAttempts || 0) + 1;
  if (newCount >= config.lockoutThreshold) {
    const lockExpiry = new Date(Date.now() + config.lockoutDurationMinutes * 60 * 1000).toISOString();
    return {
      failedAttempts: newCount,
      lockedUntil: lockExpiry,
      isNowLocked: true
    };
  }

  return {
    failedAttempts: newCount,
    lockedUntil: null,
    isNowLocked: false
  };
}

module.exports = {
  isAccountLocked,
  calculateNewLockoutState
};
