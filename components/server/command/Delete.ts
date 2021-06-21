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

function DeleteChildrenInShow(
  handler: RunsheetHandler,
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
        DeleteChildrenInShow(handler, show, child);
      const tracking = handler.getTrackingShow(show.id);
      show.tracking_list.splice(show.tracking_list.indexOf(value), 1);
      deleteOverrideProperties(show, storage.id);
      if (tracking) tracking.trackers.delete(value);
    }
  });
}

const DeleteCommand: ICommand<DeleteData> = {
  id: "delete",
  validate: (data: any) => {
    return isDeleteData(data);
  },
  run: (handler:ServerRunsheetHandler,data: DeleteData) => {
    const show = handler.getShow(data.show);
    const current = handler.getStorage(data.tracking);
    if (show && current) {
      DeleteChildrenInShow(handler, show, current);
      deleteOverrideProperties(show, data.tracking);
      const tracking_show = handler.getTrackingShow(data.show);
      if (!data.global && tracking_show) {
        show.tracking_list.splice(show.tracking_list.indexOf(data.tracking), 1);
        tracking_show.trackers.delete(data.tracking);
        const parentid = getProperty(current, show, "parent") as ParentProperty;
        if (parentid) {
          const parent = handler.getStorage(parentid.value);
          if (parent) {
            const index_list = {
              key: "index_list",
              value: getProperty(parent, show, "index_list")?.value || [],
            };
            index_list.value.splice(index_list.value.indexOf(data.tracking), 1);
            setOverrideProperty(show, data.tracking, index_list);
          }
        }
        handler.syncRunsheet();
        handler.syncTracking(tracking_show);
        handler.markDirty(true);
      } else {
        handler.syncRunsheet();
        handler.markDirty(true);
      }
    }
  },
};

export default registerCommand(DeleteCommand);
