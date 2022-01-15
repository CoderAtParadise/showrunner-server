import { ICommand, ShowHandler, registerCommand } from "@coderatparadise/showrunner-common";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const EnableCommand: ICommand<ClockCommandData> = {
    id: "clock.stop",
    validate: (data?: any): boolean => {
        return isClockCommandData(data);
    },
    run: (handler: ShowHandler, data?: ClockCommandData) => {
        if (data) handler.disableClock(data.id);
    }
};

export default function init() {
    registerCommand(EnableCommand);
}
