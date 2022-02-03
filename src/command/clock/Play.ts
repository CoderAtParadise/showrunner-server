import { ICommand } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const PlayCommand: ICommand<ClockCommandData> = {
    id: "clock.play",
    validate: (data?: any): boolean => {
        return isClockCommandData(data);
    },
    run: (data?: ClockCommandData): boolean => {
        const handler = globalShowHandler(); // TODO replace with get
        handler.getClock(data!.id)?.start();
        return true;
    }
};
