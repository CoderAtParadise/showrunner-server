import {
    ICommand,
    ShowHandler,
    registerCommand
} from "@coderatparadise/showrunner-common";
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
    run: (handler: ShowHandler, data?: ClockCommandData) => {
        if (data) handler.getClock(data?.id)?.start();
    }
};

export default function init() {
    registerCommand(StopCommand);
}
