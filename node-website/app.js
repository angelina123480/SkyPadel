require('dotenv').config({ quiet: true });

var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);

var pool = require('./database/pool');
var { attachUser } = require('./middleware/auth');

var indexRoutes = require('./routes/index');
var shopRoutes = require('./routes/shop');
var cartRoutes = require('./routes/cart');
var checkoutRoutes = require('./routes/checkout');
var orderRoutes = require('./routes/orders');
var authRoutes = require('./routes/auth');
var accountRoutes = require('./routes/account');
var adminRoutes = require('./routes/admin');

var app = express();

// Vercel (and most PaaS hosts) terminate TLS at a proxy in front of the app —
// trust it so secure cookies and req.protocol behave correctly.
app.set('trust proxy', 1);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

// set path for static assets
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    store: pool
      ? new pgSession({ pool: pool, tableName: 'session', createTableIfMissing: true })
      : undefined,
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // default 1 day, extended for "remember me" at login
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

// make auth state, admin flag, and cart count available to every view
app.use(attachUser);

// routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/shop', shopRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/orders', orderRoutes);
app.use('/account', accountRoutes);
app.use('/admin', adminRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500);
  res.render('error', { status: err.status, message: err.message });
});

module.exports = app;
