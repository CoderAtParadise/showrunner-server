import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { JSON as RUNSHEET_JSON } from "./components/common/Runsheet";
import ServerInit from "./components/server/ServerInit";
import controlRouter from "./routes/control";
import { schedule } from "./components/server/Eventhandler";
import Show from "./components/common/Show";
import { buildTrackingShow } from "./components/common/TrackingShow";
import { CommandRegisty } from "./components/server/command/ICommand";
import ServerRunsheet from "./components/server/ServerRunsheetHandler";

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
ServerInit();
schedule(() => {
schedule(() => {
  schedule(() =>
  CommandRegisty.get("load_runsheet")?.run({
    id: "3e6e3a66-5ff7-4b38-b0ff-5b6f920efc80",
  })
);
  schedule(() => {
    schedule(() =>
      CommandRegisty.get("goto")?.run({
        show: "3c8735e6-b536-419c-8950-9284116e50a2",
        tracking: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
      })
    );

    schedule(() =>
      CommandRegisty.get("goto")?.run({
        show: "3c8735e6-b536-419c-8950-9284116e50a2",
        tracking: "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
      })
    );

    schedule(() =>
      CommandRegisty.get("update")?.run({
        show: "3c8735e6-b536-419c-8950-9284116e50a2",
        tracking: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
        properties: [
          {
            override: false,
            reset: false,
            property: {
              key: "display",
              value: "Derp",
            },
          },
          {
            override: true,
            reset: false,
            property: {
              key: "display",
              value: "Nope",
            },
          },
          {
            override: true,
            reset: false,
            property: {
              key: "disabled",
              value: true,
            },
          },
          {
            override: false,
            reset: true,
            property: {
              key: "start_time",
              value: "--:--:--",
            },
          },
        ],
      })
    );

    schedule(() =>
      CommandRegisty.get("create")?.run({
        type: "bracket",
        insert: [
          { show: "default", after: "" },
          {
            show: "3c8735e6-b536-419c-8950-9284116e50a2",
            after: "",
          },
        ],
        properties: [
          {
            key: "parent",
            value: "a91b219b-f292-4dfa-aae9-8a5e80ece795",
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
            key: "index_list",
            value: [],
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
        insert: [
          { show: "default", after: "" },
          {
            show: "3c8735e6-b536-419c-8950-9284116e50a2",
            after: "38bf26cd-2e41-442a-81bf-4dc8406dafd0",
          },
        ],
        properties: [
          {
            key: "parent",
            value: "4ad398b7-e3e1-4dd7-94b6-02a943cc3c8f",
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
  });
});
});
/*schedule(() => {
  CommandRegisty.get("delete")?.run({
    show: "3c8735e6-b536-419c-8950-9284116e50a2",
    tracking: "e213a399-a633-47cd-bcbf-6f39bc1d5014",
    global: false,
  });
});*/
