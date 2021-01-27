var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const redoc = require("redoc-express");
const {getTimers} = require("./components/timer");
require("./components/runsheets");
require('./components/messages/timer_message');
const EventEmitter = require('events');

const events = new EventEmitter();
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req,res,next) => {req.events = events;next()});

app.get("/api/showrunner-api.json", (req, res) => {
  res.sendFile("showrunner-api.json", { root: "." });
});
app.get(
  "/api",
  redoc({ title: "Showrunner API", specUrl: "showrunner-api.json" })
);
app.use("/", require("./routes/index"));
app.use(require("./routes/timers"));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

//Update Loop
setInterval(() => {
  getTimers.forEach((timer, k, m) => {
    if (timer.running) timer.update();
  });
  events.emit("timer");
}, 1000);

module.exports = app;
