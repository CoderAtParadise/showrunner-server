import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import {
  JSON as RUNSHEET_JSON,
} from "./components/common/Runsheet";
import { ControlHandler, init } from "./components/server/Control";
import controlRouter from "./routes/control";
import { schedule } from "./components/server/Eventhandler";
import { TrackingShow, Tracker } from "./components/common/Tracking";
import { CommandRegisty } from "./components/server/command/ICommand";
import {INVALID as INVALID_POINT} from "./components/common/Time";
import { TimerState } from "./components/common/Timer";

const normalizePort = (val: any) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
app.use(
  morgan("dev", { stream: { write: (msg) => Debug("showrunner:http")(msg) } })
);
app.use("/", controlRouter);

app.listen(port, () => {
  debug(`Running at http://localhost:${port}`);
});
init();

const json = {
  version: 1,
  id: "3e6e3a66-5ff7-4b38-b0ff-5b6f920efc80",
  display: "Example Runsheet",
  shows: [
    {
      id: "3c8735e6-b536-419c-8950-9284116e50a2",
      tracking_list: [
        "a91b219b-f292-4dfa-aae9-8a5e80ece795",
        "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
        "e213a399-a633-47cd-bcbf-6f39bc1d5014",
        "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
        "38bf26cd-2e41-442a-81bf-4dc8406dafd0",
        "d5c2758f-67ba-4615-afb6-c3581dca5133",
      ],
      overrides: [
        {
          id: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
          start_time: "08:00:00",
        },
        {
          id: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
          display: "8am Service",
        },
      ],
      index: 0,
    },
    {
      id: "37866082-4296-4cb2-a602-a56e5fb319e8",
      tracking_list: [
        "a91b219b-f292-4dfa-aae9-8a5e80ece795",
        "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
        "e213a399-a633-47cd-bcbf-6f39bc1d5014",
        "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
        "38bf26cd-2e41-442a-81bf-4dc8406dafd0",
        "d5c2758f-67ba-4615-afb6-c3581dca5133",
      ],
      overrides: [
        {
          id: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
          start_time: "10:00:00",
        },
        {
          id: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
          display: "10am Service",
        },
      ],
      index: 1,
    },
  ],
  defaults: [
    {
      id: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
      type: "session",
      display: "Service",
      disabled: false,
      save: true,
      start_time: "08:00:00",
      timer: {
        type: "elapsed",
        source: "internal",
        behaviour: "overrun",
        duration: "01:20:00",
      },
      directions: [],
    },
    {
      id: "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
      type: "bracket",
      parent: { id: "a91b219b-f292-4dfa-aae9-8a5e80ece795", index: 0 },
      display: "Pre-Roll",
      disabled: false,
      timer: {
        type: "countdown",
        source: "internal",
        behaviour: "stop",
        duration: "00:05:00",
      },
      directions: [],
    },
    {
      id: "e213a399-a633-47cd-bcbf-6f39bc1d5014",
      type: "item",
      parent: { id: "1d7db0a7-7787-444a-bbd7-6efbeb7041cf", index: 0 },
      display: "Jan PreRoll Video",
      disabled: false,
      timer: {
        type: "countdown",
        source: "internal",
        behaviour: "stop",
        duration: "00:04:30",
      },
      directions: [],
    },
    {
      id: "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
      type: "bracket",
      parent: { id: "a91b219b-f292-4dfa-aae9-8a5e80ece795", index: 1 },
      display: "Worship",
      disabled: false,
      timer: {
        type: "elapsed",
        source: "internal",
        behaviour: "overrun",
        duration: "00:20:00",
      },
      directions: [],
    },
    {
      id: "38bf26cd-2e41-442a-81bf-4dc8406dafd0",
      type: "item",
      parent: { id: "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f", index: 0 },
      display: "Song 1",
      disabled: false,
      timer: {
        type: "elapsed",
        source: "internal",
        behaviour: "overrun",
        duration: "00:05:00",
      },
      directions: [],
    },
    {
      id: "d5c2758f-67ba-4615-afb6-c3581dca5133",
      type: "item",
      parent: { id: "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f", index: 1 },
      display: "Song 2",
      disabled: false,
      timer: {
        type: "elapsed",
        source: "internal",
        behaviour: "overrun",
        duration: "00:05:00",
      },
      directions: [],
    },
  ],
};

const runsheet = RUNSHEET_JSON.deserialize(json);
ControlHandler.loaded = runsheet;
ControlHandler.tracking = new Map<string, TrackingShow>([
  [
    "3c8735e6-b536-419c-8950-9284116e50a2",
    {
      id: "3c8735e6-b536-419c-8950-9284116e50a2",
      trackers: new Map<string, Tracker>([
        [
          "a91b219b-f292-4dfa-aae9-8a5e80ece795",
          {
            id: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
            timer: {
              start: INVALID_POINT,
              end: INVALID_POINT,
              state: TimerState.STOPPED,
            },
          },
        ],
        [
          "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
          {
            id: "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
            timer: {
              start: INVALID_POINT,
              end: INVALID_POINT,
              state: TimerState.STOPPED,
            },
          },
        ],
        [
          "38bf26cd-2e41-442a-81bf-4dc8406dafd0",
          {
            id: "38bf26cd-2e41-442a-81bf-4dc8406dafd0",
            timer: {
              start: INVALID_POINT,
              end: INVALID_POINT,
              state: TimerState.STOPPED,
            },
          },
        ],
      ]),
      active: "",
      next: "",
    },
  ],
]);

schedule(() => CommandRegisty.get("goto")?.run({
  show: "3c8735e6-b536-419c-8950-9284116e50a2",
  tracking: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
}));
