import ICommand, { registerCommand } from "./ICommand";
import ServerRunsheet, { syncRunsheet } from "../ServerRunsheetHandler";
import { getPropertyJSON } from "../../common/property/IProperty";
import { deleteOverrideProperty, setOverrideProperty } from "../../common/Show";
import { setDefaultProperty } from "../../common/Storage";
import {SaveRunsheet} from "../FileManager";

interface UpdateData {
  show: string;
  tracking: string;
  properties: { reset: boolean; override: boolean; property: any }[];
}

function isUpdateData(obj: any): obj is UpdateData {
  return (
    obj.show !== undefined &&
    obj.tracking !== undefined &&
    obj.properties !== undefined
  );
}

const UpdateCommand: ICommand<UpdateData> = {
  id: "update",
  validate: (data: any) => {
    return isUpdateData(data);
  },
  run: (data: UpdateData) => {
    if (ServerRunsheet.hasLoadedRunsheet()) {
      const storage = ServerRunsheet.getStorage(data.tracking);
      if (storage) {
        data.properties.forEach((update) => {
          const property = getPropertyJSON(update.property.key).deserialize(
            update.property.value
          );
          const show = ServerRunsheet.getShow(data.show);
          if (show) {
            if (update.reset) {
              deleteOverrideProperty(show, data.tracking, update.property.key);
            } else if (update.override) {
              setOverrideProperty(show, data.tracking, property);
            } else {
              setDefaultProperty(storage, property);
            }
          }
        });
        syncRunsheet();
        if(ServerRunsheet.runsheet)
        SaveRunsheet(ServerRunsheet.runsheet.id,ServerRunsheet.runsheet);
      }
    }
  },
};

export default registerCommand(UpdateCommand);
