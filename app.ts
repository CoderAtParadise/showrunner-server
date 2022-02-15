import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { EventHandler } from "./src/Scheduler";
import {
    initGlobalShowHandler
} from "./src/show/GlobalShowHandler";
import { router as ClockSyncRouter } from "./src/route/production/ClockSyncRoute";
import { router as RunsheetRouter } from "./src/route/production/RunsheetRoute";
import { router as CommandRouter } from "./src/route/Command";
import { init as CommandInit } from "./src/command/clock";

const normalizePort = (val: any) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
};
initGlobalShowHandler();
const app = express();
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
CommandInit();
EventHandler.onAny((msg, owner, show, id) => {
    if (msg !== "clock")
        Debug(("showrunner:" + msg) as string)(`${show}(${owner}):${id}`);
});
app.use(
    morgan("dev", {
        stream: { write: (msg: any) => Debug("showrunner:http")(msg) }
    })
);
app.use(ClockSyncRouter);
app.use(RunsheetRouter);
app.use(CommandRouter);
app.listen(port, () => {
    debug(`Running at http://localhost:${port}`);
});
