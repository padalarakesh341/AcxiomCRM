require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'acxiom_crm_super_secure_session_secret_2026_key',
  jwtSecret: process.env.JWT_SECRET || 'acxiom_crm_super_secure_jwt_secret_2026_token_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  dbPath: process.env.DB_PATH ? path.resolve(process.cwd(), process.env.DB_PATH) : path.resolve(process.cwd(), 'crm.sqlite'),
  lockoutThreshold: parseInt(process.env.LOCKOUT_THRESHOLD, 10) || 5,
  lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES, 10) || 15
};
