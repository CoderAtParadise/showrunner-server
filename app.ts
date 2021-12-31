import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { TimerClockSource } from "./src/components/TimerClockSource";
import {
    Behaviour,
    Direction
} from "@coderatparadise/showrunner-common/src/TimerSettings";
import { SMPTE } from "@coderatparadise/showrunner-common";
import { addThisTickHandler, EventHandler } from "./src/components/Scheduler";

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
    duration: new SMPTE("00:00:05:00")
});
addThisTickHandler(() => EventHandler.emit("clock"));
timer.start();
EventHandler.addListener("clock", () => {
    timer.update();
});
app.use(
    morgan("dev", {
        stream: { write: (msg: any) => Debug("showrunner:http")(msg) }
    })
);

app.listen(port, () => {
    debug(`Running at http://localhost:${port}`);
});
