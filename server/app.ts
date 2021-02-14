import express from "express";
import morgan from "morgan";
import Debug from "debug";
import timerRouter from "./routes/timer"
import controlRouter from "./routes/control";
import { SessionJson } from "./components/session";

const normalizePort = (val: any) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
app.use(morgan("dev",{stream: {write: msg => Debug("showrunner:http")(msg)}}));
app.use(timerRouter);
//app.use("/control",controlRouter);



app.listen(port, () => {
  debug(`Running at http://localhost:${port}`);
});
let json = `{
  "display": "service",
  "startTimes": ["08:00:00", "10:00:00"],
  "clock": {
    "type": "countdown",
    "overrun": "stop",
    "time": "+01:20:00"
  },
  "brackets": [
    {
      "display": "Pre-Roll",
      "clock": {
        "type": "countdown",
        "overrun": "stop",
        "time": "+00:05:00"
      },
      "items": [
        {
          "name": "Jan PreRoll Video",
          "clock": {
            "type": "countdown",
            "overrun": "stop",
            "time": "+00:04:30",
            "showTime": true
          },
          "directions": [
            {
              "target": ["audio"],
              "trigger": { "type": "switch:item" },
              "message": {
                "type": "note",
                "message": "Audio from video Computer"
              }
            },
            {
              "target": ["stage"],
              "trigger": {
                "type": "false_timer",
                "time": "-00:01:30/+00:03:00"
              },
              "message": { "type": "text", "message": "message" }
            },
            {
              "target": ["producer"],
              "trigger": { "type": "timer", "time": "-00:00:30" },
              "message": { "type": "text", "message": "message" }
            }
          ]
        }
      ]
    },
    {
      "name": "worship",
      "duration": "+00:20:00",
      "clock": {
        "type": "elapsed",
        "overrun": "true"
      },
      "items": []
    }
  ]
}`;
let j = JSON.parse(json);
debug(JSON.stringify(SessionJson.deserialize(j)));