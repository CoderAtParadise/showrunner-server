import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { EventHandler } from "./src/Scheduler";
import { TimerClockSource } from "./src/clock/TimerClockSource";
import { SMPTE } from "@coderatparadise/showrunner-common";
import {
    globalShowHandler,
    initGlobalShowHandler
} from "./src/show/GlobalShowHandler";
import { OffsetClockSource } from "./src/clock/OffsetClockSource";
import { ToTimeClockSource } from "./src/clock/ToTimeClockSource";
import { ClockBehaviour, ClockDirection } from "./src/clock/ClockData";
import { ToTimeOffsetClockSource } from "./src/clock/ToTimeOffsetClockSource";
import { router as ClockSyncRouter } from "./src/route/production/ClockSyncRoute";
import { router as RunsheetRouter } from "./src/route/production/RunsheetRoute";

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
const timer = new TimerClockSource("system", "system", "testing", "Testing", {
    behaviour: ClockBehaviour.OVERRUN,
    direction: ClockDirection.COUNTDOWN,
    duration: new SMPTE("00:00:30:00")
});
app.use(ClockSyncRouter);
app.use(RunsheetRouter);
EventHandler.onAny((msg, owner, show, id) => {
    if (msg !== "clock")
        Debug(("showrunner:" + msg) as string)(`${show}:${owner}:${id}`);
});
const offset = new OffsetClockSource(
    "system",
    "system",
    "offset_testing",
    "Offset Testing",
    {
        authority: "testing",
        offset: new SMPTE("00:00:10:00")
    }
);
const offsetNegative = new OffsetClockSource(
    "system",
    "system",
    "offset_negate_testing",
    "Offset Negative Testing",
    {
        authority: "testing",
        offset: new SMPTE("-00:00:10:00")
    }
);
const startTime = new ToTimeClockSource(
    "system",
    "system",
    "start_time",
    "Start Time",
    {
        behaviour: ClockBehaviour.STOP,
        time: new SMPTE("17:30:00:00")
    }
);
const startTimeOffset = new ToTimeOffsetClockSource(
    "system",
    "system",
    "start_time_offset",
    "Start Time Offset",
    {
        authority: "start_time",
        offset: new SMPTE("-00:04:00:00")
    }
);
const startTimeOffsetPositive = new ToTimeOffsetClockSource(
    "system",
    "system",
    "start_time_offset_positive",
    "Start Time Offset",
    {
        authority: "start_time",
        offset: new SMPTE("+00:04:00:00")
    }
);
globalShowHandler().registerClock(timer);
globalShowHandler().registerClock(offset);
globalShowHandler().registerClock(offsetNegative);
globalShowHandler().registerClock(startTime);
globalShowHandler().registerClock(startTimeOffset);
globalShowHandler().registerClock(startTimeOffsetPositive);
globalShowHandler().getClock("testing")?.start();
globalShowHandler().getClock("offset_testing")?.start();
globalShowHandler().getClock("offset_negate_testing")?.start();
globalShowHandler().getClock("start_time")?.start();
globalShowHandler().getClock("start_time_offset")?.start();
globalShowHandler().getClock("start_time_offset_positive")?.start();
app.use(
    morgan("dev", {
        stream: { write: (msg: any) => Debug("showrunner:http")(msg) }
    })
);
app.listen(port, () => {
    debug(`Running at http://localhost:${port}`);
});
