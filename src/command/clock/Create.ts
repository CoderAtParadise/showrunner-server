import {
    ICommand,
    registerCommand
} from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

interface ClockCreateData extends ClockCommandData {
    owner: string;
    type: string;
    display: string;
}

function isClockCreateData(data: any): data is ClockCreateData {
    return isClockCommandData(data);
}

export const StopCommand: ICommand<ClockCreateData> = {
    id: "clock.create",
    validate: (data?: any): boolean => {
        return isClockCreateData(data);
    },
    run: (data?: ClockCommandData) : boolean => {
        const handler = globalShowHandler(); // TODO replace with get
        handler.getClock(data!.id)?.start();
        return true;
    }
};

export function init() {
    registerCommand(StopCommand);
}
