var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var hbs = require('hbs');

var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

hbs.registerHelper('formatDate', (dateString) => {
	var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var day = dateString.getDay();
    var month = dateString.getMonth();
    var date = dateString.getDate();
    var year = dateString.getFullYear();
  	return days[day] +' ' +months[month] +' ' +date +' ' +year;
});

hbs.registerHelper('ifeq', (a, b, options) => {
    if (a == b)
      return options.fn(this);
    return options.inverse(this);
});

var app = express();

app.listen(8080, () => {
	console.log("Server started at 8080..");
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session( {secret: "1234567"} ));

app.use('/', adminRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});