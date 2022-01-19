import { ICommand, registerCommand } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

export const ResetCommand: ICommand<ClockCommandData> = {
    id: "clock.reset",
    validate: (data?: any): boolean => {
        return isClockCommandData(data);
    },
    run: (data?: ClockCommandData): boolean => {
        const handler = globalShowHandler(); // TODO replace with get
        handler.getClock(data!.id)?.reset(true);
        return true;
    }
};

export function init() {
    registerCommand(ResetCommand);
}
