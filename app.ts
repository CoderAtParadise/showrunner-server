import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { JSON as RUNSHEET_JSON } from "./components/common/Runsheet";
import { ControlHandler, init } from "./components/server/Control";
import controlRouter from "./routes/control";
import { schedule } from "./components/server/Eventhandler";
import Show from "./components/common/Show";
import { TrackingShow, buildTrackingShow } from "./components/common/Tracking";
import { CommandRegisty } from "./components/server/command/ICommand";

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
      index: 0,
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
      index: 1,
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
      index_list: [
        "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
        "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
      ],
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
      parent: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
      display: "Pre-Roll",
      disabled: false,
      index_list: ["e213a399-a633-47cd-bcbf-6f39bc1d5014"],
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
      parent: "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
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
      parent: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
      display: "Worship",
      disabled: false,
      index_list: [
        "38bf26cd-2e41-442a-81bf-4dc8406dafd0",
        "d5c2758f-67ba-4615-afb6-c3581dca5133",
      ],
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
      parent: "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
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
      parent: "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
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
ControlHandler.tracking = new Map<string, TrackingShow>();
runsheet.shows.forEach((value: Show) => {
  ControlHandler.tracking.set(value.id, buildTrackingShow(value));
});
schedule(() =>
  CommandRegisty.get("goto")?.run({
    show: "3c8735e6-b536-419c-8950-9284116e50a2",
    tracking: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
  })
);

schedule(() =>
  CommandRegisty.get("update")?.run({
    show: "3c8735e6-b536-419c-8950-9284116e50a2",
    tracking: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
    properties: [
      {
        override: false,
        property: {
          key: "display",
          value: "Derp",
        },
      },
      {
        override: true,
        property: {
          key: "display",
          value: "Nope",
        },
      },
      {
        override: true,
        property: {
          key: "disabled",
          value: true,
        },
      },
    ],
  })
);

schedule(() =>
  CommandRegisty.get("create")?.run({
    type: "bracket",
    shows: ["3c8735e6-b536-419c-8950-9284116e50a2"],
    properties: [
      {
        key: "parent",
        value: {
          id: "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
          index: 2,
        },
      },
      {
        key: "display",
        value: "Hello I'm New",
      },
      {
        key: "disabled",
        value: false,
      },
      {
        key: "timer",
        value: {
          duration: "00:32:00",
          source: "internal",
          behaviour: "hide",
          type: "countdown",
        },
      },
      {
        key: "directions",
        value: [],
      },
    ],
  })
);
schedule(() =>
  CommandRegisty.get("create")?.run({
    type: "item",
    shows: ["3c8735e6-b536-419c-8950-9284116e50a2"],
    properties: [
      {
        key: "parent",
        value: {
          id: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
          index: 1,
        },
      },
      {
        key: "display",
        value: "Hello I'm New Item",
      },
      {
        key: "disabled",
        value: false,
      },
      {
        key: "timer",
        value: {
          duration: "00:32:00",
          source: "internal",
          behaviour: "hide",
          type: "countdown",
        },
      },
      {
        key: "directions",
        value: [],
      },
    ],
  })
);
