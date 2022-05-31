import {
    CommandReturn,
    ICommand,
    SMPTE
} from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const SetCommand: ICommand<ClockCommandData & { time: string }> = {
    id: "clock.set",
    validate: (data?: any): CommandReturn | undefined => {
        // prettier-ignore
        return data.time !== undefined && isClockCommandData(data)
            ? undefined
            : { status: 400, error: "clock.invalidData", message: "Invalid Clock Data" };
    },
    run: (
        commandInfo: { show: string; session: string },
        data?: ClockCommandData & { time: string }
    ): CommandReturn => {
        const handler = globalShowHandler(); // TODO replace with get
        handler.getValue("clocks", data!.id)?.setTime(new SMPTE(data?.time));
        return { status: 200, message: "Ok" };
    }
};
