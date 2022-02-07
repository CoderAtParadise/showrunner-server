import {
    ClockDirection,
    ICommand,
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
    show: string;
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
        data.show !== undefined &&
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
    validate: (data?: any): boolean => {
        return isClockCreateData(data);
    },
    run: (data?: ClockCreateData): boolean => {
        const handler = globalShowHandler();
        const authority = globalShowHandler().getClock(data!.data.authority);
        switch (data?.data.type) {
            case "tod":
                handler.markDirty(true);
                return handler.registerClock(
                    new TODClockSource(
                        data.data.owner,
                        data.show,
                        data?.id ? data.id : uuidv4(),
                        data.data.displayName,
                        true,
                        {
                            behaviour: data.data.behaviour as ClockBehaviour,
                            time: new SMPTE(data.data.time)
                        }
                    )
                );
            case "timer":
                handler.markDirty(true);
                return handler.registerClock(
                    new TimerClockSource(
                        data.data.owner,
                        data.show,
                        data?.id ? data.id : uuidv4(),
                        data.data.displayName,
                        true,
                        {
                            behaviour: data.data.behaviour as ClockBehaviour,
                            direction: data.data.direction as ClockDirection,
                            duration: new SMPTE(data.data.time)
                        }
                    )
                );
            case "offset":
                switch (authority?.type) {
                    case "timer":
                        handler.markDirty(true);
                        return handler.registerClock(
                            new OffsetClockSource(
                                data.data.owner,
                                data.show,
                                data?.id ? data.id : uuidv4(),
                                data.data.displayName,
                                true,
                                {
                                    offset: new SMPTE(data.data.time),
                                    behaviour: data.data
                                        .behaviour as ClockBehaviour,
                                    authority: data.data.authority
                                }
                            )
                        );
                    case "tod":
                        handler.markDirty(true);
                        return handler.registerClock(
                            new TODOffsetClockSource(
                                data.data.owner,
                                data.show,
                                data?.id ? data.id : uuidv4(),
                                data.data.displayName,
                                true,
                                {
                                    offset: new SMPTE(data.data.time),
                                    behaviour: data.data
                                        .behaviour as ClockBehaviour,
                                    authority: data.data.authority
                                }
                            )
                        );
                    default:
                        return false;
                }
            default:
                return false;
        }
    }
};
