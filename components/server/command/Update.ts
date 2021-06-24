import ICommand, { registerCommand } from "./ICommand";
import { getPropertyJSON } from "../../common/property/IProperty";
import { deleteOverrideProperty, setOverrideProperty } from "../../common/Show";
import { setDefaultProperty } from "../../common/Storage";
import ServerRunsheetHandler from "../ServerRunsheetHandler";
import { getNext } from "./Goto";

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
  run: (handler: ServerRunsheetHandler, data: UpdateData) => {
    const storage = handler.getStorage(data.tracking);
    if (storage) {
      data.properties.forEach((update) => {
        const property = getPropertyJSON(update.property.key).deserialize(
          update.property.value
        );
        const show = handler.getShow(data.show);
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
      const tshow = handler.getTrackingShow(data.show);
      if(tshow)
      {
        tshow.next = getNext(handler,tshow);
        handler.syncTracking(tshow);
      }
      handler.syncRunsheet();
      handler.markDirty(true);
    }
  },
};

export default registerCommand(UpdateCommand);
