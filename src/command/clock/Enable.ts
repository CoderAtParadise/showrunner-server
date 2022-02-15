// import { ICommand, registerCommand } from "@coderatparadise/showrunner-common";
// import { globalShowHandler } from "../../show/GlobalShowHandler";
// import { ClockCommandData, isClockCommandData } from "./ClockCommandData";

// export const EnableCommand: ICommand<ClockCommandData> = {
//     id: "clock.stop",
//     validate: (data?: any): boolean => {
//         return isClockCommandData(data);
//     },
//     run: (data?: ClockCommandData): boolean => {
//         const handler = globalShowHandler(); // TODO replace with get
//         handler.enableClock(data!.id);
//         return true;
//     }
// };

// export function init() {
//     registerCommand(EnableCommand);
// }
