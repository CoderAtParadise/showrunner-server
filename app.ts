import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { EventHandler } from "./src/components/Scheduler";
import { TimerClockSource } from "./src/components/TimerClockSource";
import {
    Behaviour,
    Direction,
    SMPTE
} from "@coderatparadise/showrunner-common";
import {
    globalShowHandler,
    initGlobalShowHandler
} from "./src/GlobalShowHandler";
import { OffsetClockSource } from "./src/components/OffsetClockSource";

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
const timer = new TimerClockSource("testing", "Testing", {
    behaviour: Behaviour.OVERRUN,
    direction: Direction.COUNTDOWN,
    duration: new SMPTE("00:00:30:00")
});
initGlobalShowHandler();
EventHandler.onAny((msg, id) => {
    if (msg !== "clock") Debug(("showrunner:" + msg) as string)(id);
});
const offset = new OffsetClockSource(
    "offset_testing",
    "Offset Testing",
    globalShowHandler(),
    "testing",
    new SMPTE("00:00:10:00")
);
globalShowHandler().registerClock(timer);
globalShowHandler().registerClock(offset);
globalShowHandler().getClock("testing")?.start();
globalShowHandler().getClock("offset_testing")?.start();
app.use(
    morgan("dev", {
        stream: { write: (msg: any) => Debug("showrunner:http")(msg) }
    })
);

app.listen(port, () => {
    debug(`Running at http://localhost:${port}`);
});
