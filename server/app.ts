import express from "express";
import morgan from "morgan";
import Debug from "debug";
import timerRouter from "./routes/timer"
import controlRouter from "./routes/control";
import "./components/eventhandler";
import "./components/bracket";
import "./components/triggers/item_start";

const normalizePort = (val: any) => {
  let port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
app.use(morgan("dev",{stream: {write: msg => Debug("showrunner:http")(msg)}}));
app.use(timerRouter);
app.use("/control",controlRouter);



app.listen(port, () => {
  debug(`Running at http://localhost:${port}`);
});
