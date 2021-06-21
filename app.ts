import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import ServerInit, { ServerManager } from "./components/server/ServerInit";
import controlRouter from "./routes/control";
import { schedule } from "./components/server/Scheduler";
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
    CommandRegisty.get("load_runsheet")?.run(ServerManager.handler, {
      id: "3e6e3a66-5ff7-4b38-b0ff-5b6f920efc80",
    });
  });
});
