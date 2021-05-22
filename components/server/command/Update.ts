import ICommand, {registerCommand} from "./ICommand";
import {Storage} from "../../common/Storage";
import IProperty from "../../common/property/IProperty";

interface UpdateData {
    show: string;
    tracking:string;
    properties: {override: boolean,property:object;}
}

function isUpdateData(obj:any): obj is UpdateData {
    return obj.show !== undefined && obj.tracking !== undefined && obj.override !== undefined && obj.data !== undefined;
}

const UpdateCommand: ICommand<UpdateData> = {
    id: "loadrunsheet",
    validate: (data:any) => {
        return isUpdateData(data);
    },
    run: (data:UpdateData) => {
        let storage: Storage<any>;
    }
}

export default registerCommand(UpdateCommand);