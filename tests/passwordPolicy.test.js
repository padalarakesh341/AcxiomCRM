const { validatePassword } = require('../src/domain/passwordPolicy');

describe('Password Policy Domain Rules', () => {
  test('should accept a compliant password satisfying all criteria', () => {
    const result = validatePassword('Acxiom@2026!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject passwords shorter than 8 characters', () => {
    const result = validatePassword('Ac1@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long.');
  });

  test('should reject passwords lacking uppercase characters', () => {
    const result = validatePassword('acxiom@2026');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z).');
  });

  test('should reject passwords lacking lowercase characters', () => {
    const result = validatePassword('ACXIOM@2026');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter (a-z).');
  });

  test('should reject passwords lacking numeric digits', () => {
    const result = validatePassword('Acxiom@Secure');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number (0-9).');
  });

  test('should reject passwords lacking special characters', () => {
    const result = validatePassword('Acxiom2026Secure');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character (e.g. !@#$%^&*).');
  });
});
