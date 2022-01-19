import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { EventHandler } from "./src/Scheduler";
import { TimerClockSource } from "./src/clock/TimerClockSource";
import { SMPTE, ClockDirection } from "@coderatparadise/showrunner-common";
import {
    globalShowHandler,
    initGlobalShowHandler
} from "./src/show/GlobalShowHandler";
import { OffsetClockSource } from "./src/clock/OffsetClockSource";
import { ToTimeClockSource } from "./src/clock/ToDClockSource";
import { ClockBehaviour } from "./src/clock/ClockData";
import { ToTimeOffsetClockSource } from "./src/clock/ToDOffsetClockSource";
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
const timer = new TimerClockSource(
    "system",
    "system",
    "testing",
    "Timer",
    true,
    {
        behaviour: ClockBehaviour.OVERRUN,
        direction: ClockDirection.COUNTDOWN,
        duration: new SMPTE("00:00:30:00")
    }
);
CommandInit();
app.use(ClockSyncRouter);
app.use(RunsheetRouter);
app.use(CommandRouter);
EventHandler.onAny((msg, owner, show, id) => {
    if (msg !== "clock")
        Debug(("showrunner:" + msg) as string)(`${show}:${owner}:${id}`);
});
const offset = new OffsetClockSource(
    "system",
    "system",
    "offset_testing",
    "Timer Offset",
    true,
    {
        authority: "testing",
        behaviour: ClockBehaviour.STOP,
        offset: new SMPTE("00:00:10:00")
    }
);
const offsetNegative = new OffsetClockSource(
    "system",
    "system",
    "offset_negate_testing",
    "Timer -Offset",
    true,
    {
        authority: "testing",
        behaviour: ClockBehaviour.OVERRUN,
        offset: new SMPTE("-00:00:10:00")
    }
);
const startTime = new ToTimeClockSource(
    "system",
    "system",
    "start_time",
    "Start Time",
    true,
    {
        behaviour: ClockBehaviour.OVERRUN,
        time: new SMPTE("12:10:00:00")
    }
);
const startTimeOffset = new ToTimeOffsetClockSource(
    "system",
    "system",
    "start_time_offset",
    "Start Time -Offset",
    true,
    {
        authority: "start_time",
        behaviour: ClockBehaviour.STOP,
        offset: new SMPTE("-00:00:30:00")
    }
);
const startTimeOffsetPositive = new ToTimeOffsetClockSource(
    "system",
    "system",
    "start_time_offset_positive",
    "Start Time Offset",
    true,
    {
        authority: "start_time",
        behaviour: ClockBehaviour.OVERRUN,
        offset: new SMPTE("+00:00:30:00")
    }
);
globalShowHandler().registerClock(timer);
globalShowHandler().registerClock(offset);
globalShowHandler().registerClock(offsetNegative);
globalShowHandler().registerClock(startTime);
globalShowHandler().registerClock(startTimeOffset);
globalShowHandler().registerClock(startTimeOffsetPositive);
app.use(
    morgan("dev", {
        stream: { write: (msg: any) => Debug("showrunner:http")(msg) }
    })
);
app.listen(port, () => {
    debug(`Running at http://localhost:${port}`);
});
