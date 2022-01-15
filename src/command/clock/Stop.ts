import { ICommand, ShowHandler, registerCommand } from "@coderatparadise/showrunner-common";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const StopCommand: ICommand<ClockCommandData> = {
    id: "clock.stop",
    validate: (data?: any): boolean => {
        return isClockCommandData(data);
    },
    run: (handler: ShowHandler, data?: ClockCommandData) => {
        if (data) handler.getClock(data.id)?.stop();
    }
};

export default function init() {
    registerCommand(StopCommand);
}
