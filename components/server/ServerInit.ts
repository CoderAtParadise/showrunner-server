import InitProperties from "../common/Init";
import Goto from "./command/Goto";
import LoadRunsheet from "./command/LoadRunsheet";
import Update from "./command/Update";
import Create from "./command/Create";
import Delete from "./command/Delete";
import EventHandler, { addThisTickHandler} from "./Scheduler";
import ClockSourceInternal from "./ClockSourceInternal";
import ClockSource from "../common/ClockSource";
import { InitIO } from "./FileManager";
import ServerRunsheetHandler, { ServerRunsheet } from "./ServerRunsheetHandler";
import { INVALID } from "../common/Runsheet";

export const ServerManager: {clocks: Map<string,ClockSource>; handler: ServerRunsheetHandler} = {
  clocks: new Map<string,ClockSource>(),
  handler: new ServerRunsheet(INVALID),
}

export function ServerInit() {
  InitProperties();
  InitIO();
  Goto;
  LoadRunsheet;
  Create;
  Update;
  Delete;
  addThisTickHandler(() => {
    EventHandler.emit("clock");
  });
  EventHandler.addListener("direction:start", (showid: string, id: string) => {
    console.log(`start:${id}`);
  });
  EventHandler.addListener("direction:end", (showid: string, id: string) => {
    console.log(`end:${id}`);
  });
  EventHandler.addListener("direction:next", (showid: string, id: string) => {
    console.log(`next:${id}`);
  });
  ServerManager.clocks.set("internal",ClockSourceInternal);
}

export default ServerInit;