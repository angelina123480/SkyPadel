require('dotenv').config({ quiet: true });

var express = require('express');
var path = require('path');
var logger = require('morgan');
var clerkExpress = require('@clerk/express');

var index = require('./routes/index');
var authRoutes = require('./routes/auth');
var adminRoutes = require('./routes/admin');
var accountRoutes = require('./routes/account');

var app = express();

var isClerkConfigured = Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);
app.set('clerkConfigured', isClerkConfigured);
app.set('clerkPublishableKey', process.env.CLERK_PUBLISHABLE_KEY || '');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// set path for static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/clerk-js', express.static(path.join(__dirname, 'node_modules/@clerk/clerk-js/dist')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (isClerkConfigured) {
  app.use(clerkExpress.clerkMiddleware());
}

// make auth state available to every view (navbar sign-in/account link, etc.)
app.use(function (req, res, next) {
  res.locals.clerkConfigured = isClerkConfigured;
  res.locals.clerkPublishableKey = app.get('clerkPublishableKey');
  res.locals.isSignedIn = false;

  if (isClerkConfigured) {
    var auth = clerkExpress.getAuth(req);
    res.locals.isSignedIn = Boolean(auth && auth.userId);
  }

  next();
});

// routes
app.use('/', index);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/account', accountRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.render('error', {status:err.status, message:err.message});
});

module.exports = app;
