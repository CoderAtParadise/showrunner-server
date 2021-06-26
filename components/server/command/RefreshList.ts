import ICommand, { registerCommand } from "./ICommand";
import ServerRunsheetHandler from "../ServerRunsheetHandler";
import { DiscoverRunsheets, DiscoverStagePlots, DiscoverTemplates } from "../FileManager";

interface RefreshData {
  type: string;
}

function isLoadRunsheetData(obj: any): obj is RefreshData {
  return obj.type !== undefined;
}

const RefreshList: ICommand<RefreshData> = {
  id: "refresh",
  validate: (data: any) => {
    return isLoadRunsheetData(data);
  },
  run: (handler: ServerRunsheetHandler, data: RefreshData) => {
    switch(data.type)
    {
        case "runsheet":
            DiscoverRunsheets();
            break;
        case "template":
            DiscoverTemplates();
            break;
        case "stageplot":
            DiscoverStagePlots();
            break;
    }
  },
};

export default registerCommand(RefreshList);
