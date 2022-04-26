import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const PauseCommand: ICommand<ClockCommandData> = {
    id: "clock.pause",
    validate: (data?: any): CommandReturn | undefined => {
        // prettier-ignore
        return isClockCommandData(data)
            ? undefined
            : { status: 400, error: "clock.invalidData", message: "Invalid Clock Data" };
    },
    run: (
        commandInfo: { show: string; session: string },
        data?: ClockCommandData
    ): CommandReturn => {
        const handler = globalShowHandler(); // TODO replace with get
        handler.getValue("clocks", data!.id)?.pause(true);
        return { status: 200, message: "OK" };
    }
};
