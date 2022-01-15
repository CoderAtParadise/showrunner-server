import { ICommand, ShowHandler, registerCommand } from "@coderatparadise/showrunner-common";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const ResetCommand: ICommand<ClockCommandData> = {
    id: "clock.reset",
    validate: (data?: any): boolean => {
        return isClockCommandData(data);
    },
    run: (handler: ShowHandler, data?: ClockCommandData) => {
        if (data) handler.getClock(data.id)?.reset();
    }
};

export default function init() {
    registerCommand(ResetCommand);
}
