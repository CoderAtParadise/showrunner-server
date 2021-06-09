import ICommand, { registerCommand } from "./ICommand";
import { LoadRunsheet, RunsheetList } from "../FileManager";
import Runsheet from "../../common/Runsheet";
import ServerRunsheet, {
  syncRunsheet,
  syncTracking,
} from "../ServerRunsheetHandler";
import { StorageKey } from "../FileManager";
import { buildTrackingShow } from "../../common/TrackingShow";
import Show from "../../common/Show";
import { debug } from "debug";

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
  run: (data: LoadRunsheetData) => {
    const file = RunsheetList().find((key: StorageKey) => key.id === data.id);
    if (file)
      LoadRunsheet(file, (runsheet: Runsheet) => {
        ServerRunsheet.setRunsheet(runsheet);
        syncRunsheet();
        ServerRunsheet.runsheet?.shows.forEach((value: Show) => {
          const tracking = buildTrackingShow(value);
          ServerRunsheet.addTrackingShow(tracking);
          syncTracking(tracking);
        });
      });
  },
};

export default registerCommand(LoadRunsheetCommand);
