import ICommand, {registerCommand} from "./ICommand";

interface LoadRunsheetData {
    file: string;
}

function isLoadRunsheetData(obj:any): obj is LoadRunsheetData {
    return obj.file !== undefined;
}

const LoadRunsheetCommand: ICommand<LoadRunsheetData> = {
    id: "loadrunsheet",
    validate: (data:any) => {
        return isLoadRunsheetData(data);
    },
    run: (data:LoadRunsheetData) => {
        
    }
}

export default registerCommand(LoadRunsheetCommand);