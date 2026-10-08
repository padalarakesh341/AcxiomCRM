const AuthService = require('../src/application/authService');
const UserService = require('../src/application/userService');
const UserRepository = require('../src/data-access/userRepository');
const { getDatabase } = require('../src/database/db');

describe('Authentication, Security & Lockout Service', () => {
  let testUser = null;

  beforeAll(async () => {
    getDatabase();
    // Create an isolated user for testing lockout behavior
    const adminUser = UserRepository.findByUsername('admin');
    const res = await UserService.createUser({
      username: 'lockout_test_user',
      email: 'lockout_test@acxiom.com',
      password: 'StrongPassword@123',
      roleId: 3,
      fullName: 'Lockout Test Target'
    }, adminUser);

    testUser = res.user;
  });

  afterAll(() => {
    if (testUser) {
      const db = getDatabase();
      db.prepare(`DELETE FROM users WHERE id = ?`).run(testUser.id);
    }
  });

  test('should successfully authenticate with valid credentials and return JWT token', async () => {
    const res = await AuthService.login({
      identifier: 'lockout_test_user',
      password: 'StrongPassword@123'
    });

    expect(res.success).toBe(true);
    expect(res.token).toBeDefined();
    expect(res.user).toBeDefined();
    expect(res.user.password_hash).toBeUndefined(); // Verify DTO pattern: never leak hash
  });

  test('should reject invalid credentials and increment failed attempts counter', async () => {
    const res = await AuthService.login({
      identifier: 'lockout_test_user',
      password: 'WrongPassword@123'
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('Attempt 1 of 5');
  });

  test('should lock the account after 5 consecutive failed login attempts', async () => {
    // Current failed attempts = 1. Run 4 more failed attempts.
    await AuthService.login({ identifier: 'lockout_test_user', password: 'BadPassword@1' });
    await AuthService.login({ identifier: 'lockout_test_user', password: 'BadPassword@2' });
    await AuthService.login({ identifier: 'lockout_test_user', password: 'BadPassword@3' });
    const lockRes = await AuthService.login({ identifier: 'lockout_test_user', password: 'BadPassword@4' });

    expect(lockRes.success).toBe(false);
    expect(lockRes.isLocked).toBe(true);
    expect(lockRes.message).toContain('locked');

    // Attempting even with correct password while locked should fail
    const attemptWhileLocked = await AuthService.login({
      identifier: 'lockout_test_user',
      password: 'StrongPassword@123'
    });
    expect(attemptWhileLocked.success).toBe(false);
    expect(attemptWhileLocked.isLocked).toBe(true);
  });

  test('admin should be able to manually unlock the locked account', async () => {
    const adminUser = UserRepository.findByUsername('admin');
    const unlockRes = UserService.unlockUser(testUser.id, adminUser);
    expect(unlockRes.success).toBe(true);

    // Should now be able to login with valid password
    const loginRes = await AuthService.login({
      identifier: 'lockout_test_user',
      password: 'StrongPassword@123'
    });
    expect(loginRes.success).toBe(true);
  });
});
