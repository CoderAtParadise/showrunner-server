import express from "express";
import morgan from "morgan";
import Debug from "debug";
import cors from "cors";
import bodyparser from "body-parser";
import { EventHandler } from "./Scheduler";
import { initGlobalShowHandler } from "./show/GlobalShowHandler";
import { router as ClockSyncRouter } from "./route/production/ClockSync";
import { router as RunsheetRouter } from "./route/production/List";
import { router as CommandRouter } from "./route/production/Command";
import { init as CommandInit } from "./command/";
import {
    closeChannels,
    openChannel
} from "./show/AmpChannelManager";

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
openChannel("PVS", "192.168.0.16", 3811, "Channel 1");
CommandInit();
EventHandler.onAny((msg, id) => {
    if (msg !== "clock")
        Debug(("showrunner:" + msg) as string)(`(${id}`);
});
app.use(
    morgan("dev", {
        stream: { write: (msg: any) => Debug("showrunner:http")(msg) }
    })
);
app.use(ClockSyncRouter);
app.use(RunsheetRouter);
app.use(CommandRouter);
const server = app.listen(port, () => {
    debug(`Running at http://localhost:${port}`);
});
let connections: any[] = [];
server.on("connection", (connection) => {
    connections.push(connection);
    connection.on(
        "close",
        () => (connections = connections.filter((curr) => curr !== connection))
    );
});

const startGracefullShutdown = () => {
    server.close(() => {
        closeChannels();
        process.exit(0);
    });
    setTimeout(() => {
        console.error(
            "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
    }, 10000);
    connections.forEach((curr) => curr.end());
    setTimeout(() => connections.forEach((curr) => curr.destroy()), 5000);
};

process.on("SIGTERM", startGracefullShutdown);
process.on("SIGINT", startGracefullShutdown);
