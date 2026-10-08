const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let dbInstance = null;

function getDatabase(dbFilePath = null) {
  if (dbInstance && !dbFilePath) {
    return dbInstance;
  }

  const targetPath = dbFilePath || config.dbPath;
  const db = new Database(targetPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  if (!dbFilePath) {
    dbInstance = db;
  }
  return db;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase
};
