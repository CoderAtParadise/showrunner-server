import {
    ICommand,
    registerCommand,
    ShowHandler
} from "@coderatparadise/showrunner-common";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const PlayCommand: ICommand<ClockCommandData> = {
    id: "clock.play",
    validate: (data?: any): boolean => {
        return isClockCommandData(data);
    },
    run: (handler: ShowHandler, data?: ClockCommandData) => {
        if (data) handler.getClock(data.id)?.start();
    }
};

export default function init() {
    registerCommand(PlayCommand);
}
