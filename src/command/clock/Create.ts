import {
    ClockDirection,
    ICommand,
    CommandReturn,
    SMPTE,
    ClockSource
} from "@coderatparadise/showrunner-common";
import { TimerClockSource } from "../../clock/TimerClockSource";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { v4 as uuidv4 } from "uuid";
import { ClockBehaviour } from "../../clock/ClockData";
import { TODClockSource } from "../../clock/ToDClockSource";
import { OffsetClockSource } from "../../clock/OffsetClockSource";
import { TODOffsetClockSource } from "../../clock/ToDOffsetClockSource";
import { EventHandler } from "../../Scheduler";
import { VideoCtrlClockSource } from "../../clock/VideoCtrlClockSource";
import { AmpCtrlClock } from "../../clock/AmpCtrlClockSource";

interface BaseData {
    id?: string;
    owner: string;
    type: string;
    displayName: string;
}

interface TimerData {
    behaviour: string;
    direction: string;
    time: string;
}

interface OffsetData {
    authority: string;
    behaviour: string;
    direction: string;
    time: string;
}

interface TODData {
    behaviour: string;
    time: string;
}

interface VideoData {
    channel: string;
    source: string;
    direction: string;
}

interface AmpData {
    channel: string;
    direction: string;
}

function isTimerData(data: any): data is TimerData {
    return (
        data.behaviour !== undefined &&
        data.direction !== undefined &&
        data.time !== undefined
    );
}

function isOffsetData(data: any): data is OffsetData {
    return (
        data.authority !== undefined &&
        data.behaviour !== undefined &&
        data.direction !== undefined &&
        data.time !== undefined
    );
}

function isTODData(data: any): data is TODData {
    return data.behaviour !== undefined && data.time !== undefined;
}

function isBaseData(data: any): data is BaseData {
    return (
        data.owner !== undefined &&
        data.type !== undefined &&
        data.displayName !== undefined
    );
}

export const CreateCommand: ICommand<
    BaseData & (TimerData | OffsetData | TODData | VideoData | AmpData)
> = {
    id: "clock.create",
    validate: (data?: any): CommandReturn | undefined => {
        if (isBaseData(data)) {
            switch (data.type) {
                case "tod":
                    if (isTODData(data)) return undefined;
                    break;
                case "timer":
                    if (isTimerData(data)) return undefined;
                    break;
                case "offset":
                    if (isOffsetData(data)) return undefined;
                    break;
            }
        }
        return {
            status: 400,
            error: "clock.invalidData",
            message: "Invalid Clock Data"
        };
    },
    run: (
        commandInfo: { show: string; session: string },
        data?: BaseData & (TimerData | OffsetData | TODData | VideoData | AmpData)
    ): CommandReturn => {
        const handler = globalShowHandler();
        let authority: ClockSource<any> | undefined;
        if ((data as OffsetData)?.authority) {
            const s = (data as OffsetData).authority.split(":");
            authority = globalShowHandler().getValue(
                "clocks",
                s[2]
            ) as ClockSource<any>;
        }
        const id = data?.id ? data.id : uuidv4();
        let cdata: any;
        switch (data?.type) {
            case "videoctrl":
                handler.markDirty(true);
                cdata = data as VideoData;
                console.log("Hello");
                handler.setValue(
                    "clocks",
                    new VideoCtrlClockSource(
                        { ...commandInfo, id, owner: data.owner },
                        {
                            displayName: data.displayName,
                            automation: false,
                            channel: cdata.channel,
                            source: cdata.source,
                            direction: ClockDirection.COUNTUP
                        }
                    )
                );
                break;
            case "ampctrl":
                handler.markDirty(true);
                cdata = data as AmpData;
                handler.setValue(
                    "clocks",
                    new AmpCtrlClock(
                        { ...commandInfo, id, owner: data.owner },
                        {
                            displayName: data.displayName,
                            automation: false,
                            channel: cdata.channel,
                            direction: ClockDirection.COUNTUP
                        }
                    )
                );
                break;
            case "tod":
                handler.markDirty(true);
                cdata = data as TODData;
                handler.setValue(
                    "clocks",
                    new TODClockSource(
                        { ...commandInfo, id, owner: data.owner },
                        {
                            displayName: data.displayName,
                            behaviour: cdata.behaviour as ClockBehaviour,
                            time: new SMPTE(cdata.time),
                            automation: false
                        }
                    )
                );
                break;
            case "timer":
                handler.markDirty(true);
                cdata = data as TimerData;
                handler.setValue(
                    "clocks",
                    new TimerClockSource(
                        { ...commandInfo, id, owner: data.owner },
                        {
                            displayName: data.displayName,
                            behaviour: cdata.behaviour as ClockBehaviour,
                            direction: cdata.direction as ClockDirection,
                            time: new SMPTE(cdata.time),
                            automation: false
                        }
                    )
                );
                break;
            case "offset":
                switch (authority?.type) {
                    case "videoctrl":
                    case "timer":
                        handler.markDirty(true);
                        cdata = data as OffsetData;
                        handler.setValue(
                            "clocks",
                            new OffsetClockSource(
                                { ...commandInfo, id, owner: data.owner },
                                {
                                    displayName: data.displayName,
                                    authority: authority.identifier.id,
                                    behaviour:
                                        cdata.behaviour as ClockBehaviour,
                                    direction:
                                        cdata.direction as ClockDirection,
                                    time: new SMPTE(cdata.time),
                                    automation: false
                                }
                            )
                        );
                        break;
                    case "tod":
                        handler.markDirty(true);
                        handler.setValue(
                            "clocks",
                            new TODOffsetClockSource(
                                { ...commandInfo, id, owner: data.owner },
                                {
                                    displayName: data.displayName,
                                    authority: authority.identifier.id,
                                    behaviour:
                                        cdata.behaviour as ClockBehaviour,
                                    direction:
                                        cdata.direction as ClockDirection,
                                    time: new SMPTE(cdata.time),
                                    automation: false
                                }
                            )
                        );
                        break;
                    default:
                        return {
                            status: 404,
                            error: "clock.unknownType",
                            message: "Unknown Clock Type"
                        };
                }
                break;
            default:
                return {
                    status: 404,
                    error: "clock.unknownType",
                    message: "Unknown Clock Type"
                };
        }
        EventHandler.emit(
            `clock-add-${commandInfo.show}:${commandInfo.session}`,
            id
        );
        return { status: 200, message: "Ok" };
    }
};
