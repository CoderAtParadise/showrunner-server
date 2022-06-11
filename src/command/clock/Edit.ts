import {
    CommandReturn,
    ICommand
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../../Scheduler";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { diffObject } from "../../util/Diffobject";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

interface ClockEditData extends ClockCommandData {
    data: any;
}

export const EditCommand: ICommand<ClockEditData> = {
    id: "clock.edit",
    validate: (data?: any): CommandReturn | undefined => {
        // prettier-ignore
        return data.data !== undefined && isClockCommandData(data)
            ? undefined
            : { status: 400, error: "clock.invalidData", message: "Invalid Clock Data" };
    },
    run: (
        commandInfo: { show: string; session: string },
        data?: ClockEditData
    ): CommandReturn => {
        const handler = globalShowHandler(); // TODO replace with get
        const clock = handler.getValue("clocks", data!.id);
        if (clock !== undefined) {
            const oldSetttings = { ...clock.settings };
            const oldData = {
                displayName: clock.displayName(),
                duration: clock.duration(),
                data: clock.data()
            };
            clock.updateSettings(data!.data);
            const diff = diffObject(oldSetttings, clock.settings);
            const datadiff = diffObject(oldData, {
                displayName: clock.displayName(),
                duration: clock.duration(),
                data: clock.data()
            });
            if (diff.time !== undefined)
                diff.time = clock.settings.time.toString();
            if (datadiff.duration !== undefined)
                datadiff.duration = clock.duration().toString();
            EventHandler.emit(
                `clock-update-${commandInfo.show}:${commandInfo.session}`,
                clock.identifier.id,
                { settings: diff, additional: datadiff }
            );
            handler.markDirty(true);
            return { status: 200, message: "Ok" };
        }
        return {
            status: 400,
            error: "clock.unknownClock",
            message: `Unknown Clock ${data!.id}`
        };
    }
};
