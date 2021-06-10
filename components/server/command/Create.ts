import {
  getDefaultProperty,
  Type,
} from "../../common/Storage";
import { DEFAULT, insertInto } from "../../common/Show";
import ICommand, { registerCommand } from "./ICommand";
import ServerRunsheet,{ syncRunsheet,syncTracking } from "../ServerRunsheetHandler";
import IProperty, { getPropertyJSON, hasAllProperties } from "../../common/property/IProperty";
import { v4 } from "uuid";
import {
  BracketPropertiesDefault,
  ItemPropertiesDefault,
  SessionPropertiesDefault,
} from "../../common/StorageTypes";
import { buildTracker } from "../../common/Tracker";
import { ParentProperty } from "../../common/property/Parent";

interface CreateData {
  type: string;
  insert: { show: string; after: string, useDefault: boolean }[];
  properties: { key: string; value: any }[];
}

function isCreateData(obj: any): obj is CreateData {
  return (
    obj.type !== undefined &&
    obj.shows !== undefined &&
    obj.insert !== undefined
  );
}

const CreateCommand: ICommand<CreateData> = {
  id: "create",
  validate: (data: any) => {
    return isCreateData(data);
  },
  run: (data: CreateData) => {
    if (ServerRunsheet.hasLoadedRunsheet()) {
      const properties: IProperty<any>[] = [];
      data.properties.forEach((value: { key: string; value: any }) =>
        properties.push(getPropertyJSON(value.key).deserialize(value.value))
      );
      const id = v4();
      switch (data.type as Type) {
        case Type.SESSION:
          if (hasAllProperties(SessionPropertiesDefault, properties)) {
           ServerRunsheet.addStorage({
              id: id,
              type: Type.SESSION,
              properties,
            });
          }
          break;
        case Type.BRACKET:
          if (hasAllProperties(BracketPropertiesDefault, properties)) {
            ServerRunsheet.addStorage({
              id: id,
              type: Type.BRACKET,
              properties,
            });
          }
          break;
        case Type.ITEM:
          if (hasAllProperties(ItemPropertiesDefault, properties)) {
            ServerRunsheet.addStorage({
              id: id,
              type: Type.ITEM,
              properties,
            });
          }
          break;
      }
      const tracker = buildTracker(id);
      const current = ServerRunsheet.getStorage(id);
      if (current) {
        if (current) {
          const parentid = getDefaultProperty(
            current,
            "parent"
          ) as ParentProperty;
          if (parentid) {
            const parent = ServerRunsheet.getStorage(parentid.value);
            if (parent) {
              data.insert.forEach((insert: { show: string; after: string, useDefault: boolean }) => {
                if (insert.show === "default") {
                  insertInto(DEFAULT, parent, insert.after, id, true);
                } else {
                  const show = ServerRunsheet.getShow(insert.show);
                  const trackingShow = ServerRunsheet.getTrackingShow(insert.show);
                  if (show && trackingShow) {
                    insertInto(show, parent, insert.after, id);
                    show.tracking_list.push(id);
                    trackingShow.trackers.set(id, tracker);
                    syncTracking(trackingShow);
                  }
                }
              });
            }
          }
        }
      }
      syncRunsheet();
      ServerRunsheet.markDirty();
    }
  },
};

export default registerCommand(CreateCommand);
