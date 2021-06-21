import ICommand, { registerCommand } from "./ICommand";
import { LoadRunsheet, RunsheetList } from "../FileManager";
import Runsheet from "../../common/Runsheet";
import ServerRunsheetHandler, { syncTracking } from "../ServerRunsheetHandler";
import { StorageKey } from "../FileManager";
import { buildTrackingShow } from "../../common/TrackingShow";
import Show from "../../common/Show";
import { ServerManager } from "../ServerInit";
import { ServerRunsheet } from "../ServerRunsheetHandler";

interface LoadRunsheetData {
  id: string;
}

function isLoadRunsheetData(obj: any): obj is LoadRunsheetData {
  return obj.id !== undefined;
}

const LoadRunsheetCommand: ICommand<LoadRunsheetData> = {
  id: "load_runsheet",
  validate: (data: any) => {
    return isLoadRunsheetData(data);
  },
  run: (handler: ServerRunsheetHandler, data: LoadRunsheetData) => {
    const file = RunsheetList().find((key: StorageKey) => key.id === data.id);
    if (file)
      LoadRunsheet(file, (runsheet: Runsheet) => {
        ServerManager.handler = new ServerRunsheet(runsheet);
        ServerManager.handler.syncRunsheet();
        ServerManager.handler.syncAllTracking();
      });
  },
};

export default registerCommand(LoadRunsheetCommand);
