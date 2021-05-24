import ICommand, { registerCommand } from "./ICommand";
import { ControlHandler } from "../Control";
import IProperty, { getPropertyJSON } from "../../common/property/IProperty";
import { eventhandler } from "../Eventhandler";
import { JSON as RJSON } from "../../common/Runsheet";

interface UpdateData {
  show: string;
  tracking: string;
  properties: { override: boolean; property: any }[];
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
    if (ControlHandler.loaded) {
      const storage = ControlHandler.loaded.defaults.get(data.tracking);
      if (storage) {
        data.properties.forEach((update) => {
          const property = getPropertyJSON(update.property.key).deserialize(
            update.property
          );
          if (update.override) {
            const show = ControlHandler.loaded?.shows.get(data.show);
            if (show) {
              const overrides = show.overrides.get(data.tracking);
              if (overrides) {
                const op = overrides.find(
                  (value: IProperty<any>) => value.key === property.key
                );
                if (op) op.value = property.value;
                else overrides.push(property);
              }
            }
          } else {
            const ps = storage.properties.find(
              (value: IProperty<any>) => value.key === property.key
            );
            ps.value = property.value;
          }
        });
        eventhandler.emit(
          "sync",
          "runsheet",
          RJSON.serialize(ControlHandler.loaded)
        );
      }
    }
  },
};

export default registerCommand(UpdateCommand);
