import Storage, { getProperty, hasProperty } from "../../common/Storage";
import Show, {
  deleteOverrideProperties,
  deleteOverrideProperty,
  setOverrideProperty,
} from "../../common/Show";
import ICommand, { registerCommand } from "./ICommand";
import { ParentProperty } from "../../common/property/Parent";
import ServerRunsheetHandler from "../ServerRunsheetHandler";
import { IndexListProperty } from "../../common/property/IndexList";
import RunsheetHandler from "../../common/RunsheetHandler";
import TrackingShow from "../../common/TrackingShow";

interface DeleteData {
  show: string;
  tracking: string;
  global: boolean;
}

function isDeleteData(obj: any): obj is DeleteData {
  return (
    obj.show !== undefined &&
    obj.tracking !== undefined &&
    obj.global !== undefined
  );
}

function DeleteFromShow(tshow: TrackingShow, show: Show, id: string): void {
  tshow.trackers.delete(id);
  show.tracking_list.splice(show.tracking_list.indexOf(id), 1);
  deleteOverrideProperties(show, id);
}

function DeleteChildrenInShow(
  handler: RunsheetHandler,
  tshow: TrackingShow,
  show: Show,
  storage: Storage<any>
) {
  const index_list = {
    key: "index_list",
    value: getProperty(storage, show, "index_list")?.value || [],
  } as IndexListProperty;
  index_list.value.forEach((value: string) => {
    const child = handler.getStorage(value);
    if (child) {
      if (hasProperty(child, "index_list"))
        DeleteChildrenInShow(handler, tshow, show, child);
      DeleteFromShow(tshow, show, value);
    }
  });
}

function DeleteChildFromParent(
  handler: RunsheetHandler,
  show: Show,
  child: Storage<any>
) {
  const pid = getProperty(child, show, "parent") as ParentProperty;
  if (pid) {
    const parent = handler.getStorage(pid.value);
    if (parent) {
      const index_list: IndexListProperty = {
        key: "index_list",
        value: Array.from(getProperty(parent, show, "index_list")?.value) || [],
      };
      index_list.value.splice(index_list.value.indexOf(child.id), 1);
      setOverrideProperty(show, pid.value, index_list);
    }
  }
}

const DeleteCommand: ICommand<DeleteData> = {
  id: "delete",
  validate: (data: any) => {
    return isDeleteData(data);
  },
  run: (handler: ServerRunsheetHandler, data: DeleteData) => {
    const show = handler.getShow(data.show);
    const tshow = handler.getTrackingShow(data.show);
    const toDelete = handler.getStorage(data.tracking);
    if (show && toDelete && tshow) {
      DeleteChildrenInShow(handler, tshow, show, toDelete);
      DeleteFromShow(tshow, show, data.tracking);
      DeleteChildFromParent(handler, show, toDelete);
      if (data.global) {
        handler.showList().forEach((id: string) => {
          if (data.show !== id) {
            const gshow = handler.getShow(id);
            const gtshow = handler.getTrackingShow(id);
            const gtoDelete = handler.getStorage(data.tracking);
            if (gshow && gtoDelete && gtshow) {
              DeleteChildrenInShow(handler, gtshow, gshow, gtoDelete);
              DeleteFromShow(gtshow, gshow, data.tracking);
              DeleteChildFromParent(handler, gshow, gtoDelete);
              handler.syncTracking(gtshow);
            }
          }
        });
      }
      handler.syncRunsheet();
      handler.syncTracking(tshow);
      handler.markDirty(true);
    }
  },
};

export default registerCommand(DeleteCommand);
