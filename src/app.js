const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');

const config = require('./config');
const { getDatabase } = require('./database/db');
const antiForgery = require('./security/antiForgery');
const errorHandler = require('./cross-cutting/errorHandler');

const webRoutes = require('./routes/webRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Ensure DB is initialized
getDatabase();

// View Engine & Layout Setup
app.set('views', path.join(__dirname, 'presentation', 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Request Parsers & Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.sessionSecret));

// Session Configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash Notifications
app.use(flash());

// Anti-Forgery CSRF Protection
app.use(antiForgery);

// Global Template Locals
app.use((req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.path = req.path;
  next();
});

// Mount Routes
app.use('/api', apiRoutes);
app.use('/', webRoutes);

// Catch 404
app.use((req, res, next) => {
  const err = new Error(`Resource ${req.originalUrl} not found.`);
  err.status = 404;
  next(err);
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
