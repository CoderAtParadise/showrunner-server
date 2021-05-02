import express from "express";
import morgan from "morgan";
import Debug from "debug";
import controlRouter from "./routes/control";
import { eventhandler, schedule } from "./components/server/Eventhandler";
import { LoadRunsheet, Goto, init } from "./components/server/Control";
import cors from "cors";
import bodyparser from "body-parser";


const normalizePort = (val: any) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
app.use(
  morgan("dev", { stream: { write: (msg) => Debug("showrunner:http")(msg) } })
);
app.use("/", controlRouter);

app.listen(port, () => {
  debug(`Running at http://localhost:${port}`);
});
init(eventhandler); //Pass into ControlHandler becuase for some reason eventhandler is losing data

schedule(() => {
  LoadRunsheet({
    command: "loadRunsheet",
    session: "",
    tracking_id: "",
    data: "temp",
  });
  schedule(() => {
    Goto({
      command: "goto",
      session: "3c8735e6-b536-419c-8950-9284116e50a2",
      tracking_id: "e213a399-a633-47cd-bcbf-6f39bc1d5014",
    });
    schedule(() => {
      Goto({
        command: "goto",
        session: "3c8735e6-b536-419c-8950-9284116e50a2",
        tracking_id: "1d7db0a7-7787-444a-bbd7-6efbeb7041cf",
      });
    });
  });
});
