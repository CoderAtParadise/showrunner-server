import express from "express";
import morgan from "morgan";
import Debug from "debug";
import controlRouter from "./routes/control";
import trackingRouter from "./routes/tracking";
import { schedule } from "./components/eventhandler";
import Tracking from "./components/tracking";

const normalizePort = (val: any) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
app.use(
  morgan("dev", { stream: { write: (msg) => Debug("showrunner:http")(msg) } })
);
app.use("/tracking", trackingRouter);
app.use("/control",controlRouter);

app.listen(port, () => {
  debug(`Running at http://localhost:${port}`);
});

schedule(() => {
  Tracking.setupTracking("temp");
  schedule(() => {
  Tracking.startTracking(Tracking.getNext(Tracking.sessionManager));
  });
});
