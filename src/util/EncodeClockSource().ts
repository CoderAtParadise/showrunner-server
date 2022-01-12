import { ClockSource, SMPTE } from "@coderatparadise/showrunner-common";
import { LooseObject } from "./LooseObject";

export const encodeClockSouce = (clock: ClockSource): object => {
    return {
        type: clock.type,
        owner: clock.owner,
        show: clock.show,
        id: clock.id,
        display: clock.display,
        current: clock.current().toString(),
        data: encodeClockSourceData(clock.data() || {})
    };
};

const encodeClockSourceData = (data: LooseObject): LooseObject => {
    const rdata: LooseObject = {};
    Object.keys(data).forEach((key: string) => {
        const val = data[key];
        if (val instanceof SMPTE) rdata[key] = (val as SMPTE).toString();
        else if (val instanceof Object || typeof val === "object") rdata[key] = encodeClockSourceData(val);
        else rdata[key] = val;
    });
    return rdata;
};
