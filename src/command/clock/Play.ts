import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const PlayCommand: ICommand<ClockCommandData> = {
    id: "clock.play",
    validate: (data?: any): CommandReturn | undefined => {
        return isClockCommandData(data)
            ? undefined
            : { status: 400, error: "clock.invalidData" };
    },
    run: (data?: ClockCommandData): CommandReturn => {
        const handler = globalShowHandler(); // TODO replace with get
        handler.getClock(data!.id)?.start();
        return { status: 200 };
    }
};
