import Storage, {
  getDefaultProperty,
  getProperty,
  Type,
} from "../../common/Storage";
import Show, {
  getOverrideProperty,
  hasOverrideProperty,
} from "../../common/Show";
import ICommand, { registerCommand } from "./ICommand";
import { ParentProperty } from "../../common/property/Parent";
import { EventHandler } from "../Eventhandler";
import ServerRunsheet from "../ServerRunsheetHandler";
import { setPriority } from "os";

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

const DeleteCommand: ICommand<DeleteData> = {
  id: "delete",
  validate: (data: any) => {
    return isDeleteData(data);
  },
  run: (data: DeleteData) => {
    const show = ServerRunsheet.getShow(data.show);
    const current = ServerRunsheet.getStorage(data.tracking);
    if (show && current) {
      const parentid = getProperty(current, show, "parent") as ParentProperty;
      if (parentid) {
        const parent = ServerRunsheet.getStorage(parentid.value);
        if (parent) {
          const index_list = getProperty(parent, show, "index_list");
          if(index_list)
          {}
        }
      }
    }
  },
};

export default registerCommand(DeleteCommand);
