import express from "express";
import morgan from "morgan";
import Debug from "debug";
import timerRouter from "./routes/timer"

const normalizePort = (val: any) => {
  let port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
app.use(morgan("dev",{stream: {write: msg => Debug("showrunner:http")}}));
app.use(timerRouter);



app.listen(port, () => {
  debug(`Running at https://localhost:${port}`);
});
