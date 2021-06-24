import ICommand, { registerCommand } from "./ICommand";
import { DeleteRunsheet, RunsheetList } from "../FileManager";
import ServerRunsheetHandler from "../ServerRunsheetHandler";
import { StorageKey } from "../FileManager";

interface DeleteRunsheetData {
  id: string;
}

function isLoadRunsheetData(obj: any): obj is DeleteRunsheetData {
  return obj.id !== undefined;
}

const DeleteRunsheetCommand: ICommand<DeleteRunsheetData> = {
  id: "delete_runsheet",
  validate: (data: any) => {
    return isLoadRunsheetData(data);
  },
  run: (handler: ServerRunsheetHandler, data: DeleteRunsheetData) => {
    const file = RunsheetList().find((key: StorageKey) => key.id === data.id);
    
    if (file)
      DeleteRunsheet(file);
  },
};

export default registerCommand(DeleteRunsheetCommand);
