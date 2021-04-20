import express from "express";
import morgan from "morgan";
import Debug from "debug";
import controlRouter from "./routes/control";
import {LoadRunsheet,Goto,Discover,runsheetDir,templateDir,knownRunsheets,knownTemplates, init} from "./components/server/Control";
import { eventhandler, schedule,addThisTickHandler} from "./components/server/Eventhandler";
import fs from "fs";

const normalizePort = (val: any) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
const debug = Debug("showrunner:server");
const port = normalizePort(process.env.PORT || "3001");
app.use(
  morgan("dev", { stream: { write: (msg) => Debug("showrunner:http")(msg) } })
);
app.use("/",controlRouter);

app.listen(port, () => {
  debug(`Running at http://localhost:${port}`);
});
eventhandler.on("sync",() => {
  console.log("Hello");
})
schedule(() => {
  LoadRunsheet({command: "loadRunsheet",data: "temp"});
  /*schedule(() => {
   Goto({command:"goto",tracking_id:"a91b219b-f292-4dfa-aae9-8a5e80ece795"});
    schedule(() => {
     Goto({command:"goto",tracking_id:"1d7db0a7-7787-444a-bbd7-6efbeb7041cf"});
    })
  });*/
});
console.log(eventhandler);
init();
addThisTickHandler(() => {eventhandler.emit("clock");});
Discover(runsheetDir, knownRunsheets);
Discover(templateDir, knownTemplates);
fs.watch(runsheetDir, (): void => Discover(runsheetDir, knownRunsheets));
fs.watch(templateDir, (): void => Discover(templateDir, knownTemplates));
