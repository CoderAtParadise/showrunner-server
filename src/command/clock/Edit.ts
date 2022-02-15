import {
    CommandReturn,
    ICommand,
    MutableClockSource
} from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

interface ClockEditData extends ClockCommandData {
    data: any;
}

export const EditCommand: ICommand<ClockEditData> = {
    id: "clock.edit",
    validate: (data?: any): CommandReturn | undefined => {
        return data.data !== undefined && isClockCommandData(data)
            ? undefined
            : { status: 400, error: "clock.invalidData" };
    },
    run: (data?: ClockEditData): CommandReturn => {
        const handler = globalShowHandler(); // TODO replace with get
        const clock = handler.getClock(data!.id);
        if (clock && (clock as MutableClockSource)) {
            (clock as MutableClockSource).setData(data!.data);
            handler.markDirty(true);
            return { status: 200 };
        }
        return { status: 400, error: "clock.unknownClock" };
    }
};
