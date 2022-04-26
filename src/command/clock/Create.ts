import {
    ClockDirection,
    ICommand,
    CommandReturn,
    SMPTE
} from "@coderatparadise/showrunner-common";
import { TimerClockSource } from "../../clock/TimerClockSource";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { v4 as uuidv4 } from "uuid";
import { ClockBehaviour } from "../../clock/ClockData";
import { TODClockSource } from "../../clock/ToDClockSource";
import { OffsetClockSource } from "../../clock/OffsetClockSource";
import { TODOffsetClockSource } from "../../clock/ToDOffsetClockSource";

interface ClockCreateData {
    session: string;
    id?: string;
    data: {
        owner: string;
        type: string;
        displayName: string;
        authority: string;
        time: string;
        behaviour: string;
        direction: string;
    };
}

function isClockCreateData(data: any): data is ClockCreateData {
    return (
        data.session !== undefined &&
        data.data !== undefined &&
        data.data.owner !== undefined &&
        data.data.type !== undefined &&
        data.data.displayName !== undefined &&
        data.data.authority !== undefined &&
        data.data.time !== undefined &&
        data.data.behaviour !== undefined &&
        data.data.direction !== undefined
    );
}

export const CreateCommand: ICommand<ClockCreateData> = {
    id: "clock.create",
    validate: (data?: any): CommandReturn | undefined => {
        // prettier-ignore
        return isClockCreateData(data)
            ? undefined
            : { status: 400, error: "clock.invalidData", message: "Invalid Clock Data" };
    },
    run: (
        commandInfo: { show: string; session: string },
        data?: ClockCreateData
    ): CommandReturn => {
        const handler = globalShowHandler();
        const authority = globalShowHandler().getValue(
            "clocks",
            data!.data.authority
        );
        // switch (data?.data.type) {
        //     case "tod":
        //         handler.markDirty(true);
        //         handler.registerClock(
        //             new TODClockSource(
        //                 data.data.owner,
        //                 data.show,
        //                 data?.id ? data.id : uuidv4(),
        //                 data.data.displayName,
        //                 true,
        //                 {
        //                     behaviour: data.data.behaviour as ClockBehaviour,
        //                     time: new SMPTE(data.data.time)
        //                 }
        //             )
        //         );
        //         break;
        //     case "timer":
        //         handler.markDirty(true);
        //         handler.registerClock(
        //             new TimerClockSource(
        //                 data.data.owner,
        //                 data.show,
        //                 data?.id ? data.id : uuidv4(),
        //                 data.data.displayName,
        //                 true,
        //                 {
        //                     behaviour: data.data.behaviour as ClockBehaviour,
        //                     direction: data.data.direction as ClockDirection,
        //                     time: new SMPTE(data.data.time)
        //                 }
        //             )
        //         );
        //         break;
        //     case "offset":
        //         switch (authority?.type) {
        //             case "timer":
        //                 handler.markDirty(true);
        //                 handler.registerClock(
        //                     new OffsetClockSource(
        //                         data.data.owner,
        //                         data.show,
        //                         data?.id ? data.id : uuidv4(),
        //                         data.data.displayName,
        //                         true,
        //                         {
        //                             time: new SMPTE(data.data.time),
        //                             behaviour: data.data
        //                                 .behaviour as ClockBehaviour,
        //                             authority: data.data.authority
        //                         }
        //                     )
        //                 );
        //                 break;
        //             case "tod":
        //                 handler.markDirty(true);
        //                 handler.registerClock(
        //                     new TODOffsetClockSource(
        //                         data.data.owner,
        //                         data.show,
        //                         data?.id ? data.id : uuidv4(),
        //                         data.data.displayName,
        //                         true,
        //                         {
        //                             time: new SMPTE(data.data.time),
        //                             behaviour: data.data
        //                                 .behaviour as ClockBehaviour,
        //                             authority: data.data.authority
        //                         }
        //                     )
        //                 );
        //                 break;
        //             default:
        //                 return { status: 404, error: "clock.unknownType" };
        //         }
        //         break;
        //     default:
        //         return { status: 404, error: "clock.unknownType" };
        // }
        return { status: 200, message: "Ok" };
    }
};
