
import ServerRunsheetHandler from "../ServerRunsheetHandler";
export interface ICommand<Data> {
    id: string;
    validate: (data:any) => boolean;
    run: (handler:ServerRunsheetHandler,data:Data) => void;
}

export const CommandRegisty = new Map<string,ICommand<any>>();

export function registerCommand<Data>(command:ICommand<Data>) : void {
    if(!CommandRegisty.has(command.id))
        CommandRegisty.set(command.id,command);
}

export const INVALID : ICommand<undefined> = {
    id: "invalid",
    run: (handler:ServerRunsheetHandler,data:undefined) => {
        throw "Invalid Command";
    },
    validate: (data:undefined) => false,
}

export default ICommand;