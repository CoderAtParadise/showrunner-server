import {
    ICommand,
    MutableClockSource
} from "@coderatparadise/showrunner-common";
import debug from "debug";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

interface ClockEditData extends ClockCommandData {
    data: any;
}

export const EditCommand: ICommand<ClockEditData> = {
    id: "clock.edit",
    validate: (data?: any): boolean => {
        return data.data !== undefined && isClockCommandData(data);
    },
    run: (data?: ClockEditData) => {
        const handler = globalShowHandler(); // TODO replace with get
        const clock = handler.getClock(data!.id);
        if (clock && (clock as MutableClockSource)) {
            debug("showrunner:debug")(data!.data);
            (clock as MutableClockSource).setData(data!.data);
        }

        return false;
    }
};
