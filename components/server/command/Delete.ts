import Storage, { getProperty, hasProperty } from "../../common/Storage";
import Show, {
  deleteOverrideProperties,
  deleteOverrideProperty,
  setOverrideProperty,
} from "../../common/Show";
import ICommand, { registerCommand } from "./ICommand";
import { ParentProperty } from "../../common/property/Parent";
import ServerRunsheet, {
  syncRunsheet,
  syncTracking,
} from "../ServerRunsheetHandler";
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
  run: (data: DeleteData) => {
    const show = ServerRunsheet.getShow(data.show);
    const current = ServerRunsheet.getStorage(data.tracking);
    if (show && current) {
      DeleteChildrenInShow(ServerRunsheet, show, current);
      deleteOverrideProperties(show, data.tracking);
      const tracking_show = ServerRunsheet.getTrackingShow(data.show);
      if (!data.global && tracking_show) {
        show.tracking_list.splice(show.tracking_list.indexOf(data.tracking), 1);
        tracking_show.trackers.delete(data.tracking);
        const parentid = getProperty(current, show, "parent") as ParentProperty;
        if (parentid) {
          const parent = ServerRunsheet.getStorage(parentid.value);
          if (parent) {
            const index_list = {
              key: "index_list",
              value: getProperty(parent, show, "index_list")?.value || [],
            };
            index_list.value.splice(index_list.value.indexOf(data.tracking), 1);
            setOverrideProperty(show, data.tracking, index_list);
          }
        }
        syncRunsheet();
        syncTracking(tracking_show);
        ServerRunsheet.markDirty();
      } else {
        syncRunsheet();
        ServerRunsheet.markDirty();
      }
    }
  },
};

export default registerCommand(DeleteCommand);
