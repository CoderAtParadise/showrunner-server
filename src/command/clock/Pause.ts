import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const PauseCommand: ICommand<ClockCommandData> = {
    id: "clock.pause",
    validate: (data?: any): CommandReturn | undefined => {
        return isClockCommandData(data)
            ? undefined
            : { status: 400, error: "clock.invalidData" };
    },
    run: (data?: ClockCommandData) => {
        const handler = globalShowHandler(); // TODO replace with get
        handler.getClock(data!.id)?.pause(true);
        return { status: 200 };
    }
};
