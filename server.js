const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/cross-cutting/logger');

const server = app.listen(config.port, () => {
  logger.info(`=======================================================`);
  logger.info(`  AcxiomCRM Server is actively running!`);
  logger.info(`  Environment : ${config.env}`);
  logger.info(`  Web Portal  : http://localhost:${config.port}`);
  logger.info(`  REST API    : http://localhost:${config.port}/api/v1`);
  logger.info(`  Swagger Docs: http://localhost:${config.port}/api/docs`);
  logger.info(`=======================================================`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
