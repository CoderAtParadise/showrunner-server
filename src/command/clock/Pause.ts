import { ICommand, ShowHandler, registerCommand } from "@coderatparadise/showrunner-common";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const PauseCommand: ICommand<ClockCommandData> = {
    id: "clock.pause",
    validate: (data?: any): boolean => {
        return isClockCommandData(data);
    },
    run: (handler: ShowHandler, data?: ClockCommandData) => {
        if (data) handler.getClock(data.id)?.pause();
    }
};

export default function init() {
    registerCommand(PauseCommand);
}
