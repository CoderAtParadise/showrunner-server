import { checkProperties, Type } from "../../common/Storage";
import { ControlHandler } from "../Control";
import ICommand, { registerCommand } from "./ICommand";
import IProperty, { getPropertyJSON } from "../../common/property/IProperty";
import { v4 } from "uuid";
import { BracketPropertiesDefault, ItemPropertiesDefault, SessionPropertiesDefault } from "../../common/Types";
import { buildTracker, TRACKINGSHOW_JSON } from "../../common/Tracking";
import {JSON as RJSON} from "../../common/Runsheet";
import { eventhandler } from "../Eventhandler";

interface CreateData {
  type: string;
  shows: string[];
  after: string;
  properties: { key: string; value: any }[];
}

function isCreateData(obj: any): obj is CreateData {
  return obj.type !== undefined && obj.shows !== undefined && obj.after !== undefined && obj.properties !== undefined;
}

const CreateCommand: ICommand<CreateData> = {
  id: "create",
  validate: (data: any) => {
    return isCreateData(data);
  },
  run: (data: CreateData) => {
    if (ControlHandler.loaded) {
      const properties: IProperty<any>[] = [];
      data.properties.forEach((value: { key: string; value: any }) =>
        properties.push(getPropertyJSON(value.key).deserialize(value.value))
      );
      const id = v4();
      switch (data.type as Type) {
        case Type.SESSION:
          if (checkProperties(SessionPropertiesDefault, properties)) {
            ControlHandler.loaded.defaults.set(id, {
              id: id,
              type: Type.SESSION,
              properties,
            });
          }
          break;
        case Type.BRACKET:
          if (checkProperties(BracketPropertiesDefault, properties)) {
            ControlHandler.loaded.defaults.set(id, {
              id: id,
              type: Type.BRACKET,
              properties,
            });
          }
          break;
        case Type.ITEM:
          if (checkProperties(ItemPropertiesDefault, properties)) {
            ControlHandler.loaded.defaults.set(id, {
              id: id,
              type: Type.ITEM,
              properties,
            });
          }
          break;
      }
      const tracker = buildTracker(id);
      data.shows.forEach((showid: string) => {
        const show = ControlHandler.loaded?.shows.get(showid);
        const trackingShow = ControlHandler.tracking.get(showid);
        if (show && trackingShow) {
          show.tracking_list.push(id);
          trackingShow.trackers.set(id, tracker);
          eventhandler.emit(
            "sync",
            "tracking",
            TRACKINGSHOW_JSON.serialize(trackingShow)
          );
        }
      });
      eventhandler.emit("sync", "runsheet",RJSON.serialize(ControlHandler.loaded));
    }
  },
};

export default registerCommand(CreateCommand);
