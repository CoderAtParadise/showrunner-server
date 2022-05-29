import { SMPTE } from "@coderatparadise/showrunner-common";

export interface LooseObject {
    [key: string]: any;
}

export const encodeData = (data: LooseObject): LooseObject => {
    const rdata: LooseObject = {};
    Object.keys(data).forEach((key: string) => {
        const val = data[key];
        if (val instanceof SMPTE) rdata[key] = (val as SMPTE).toString();
        else if (Array.isArray(val)) rdata[key] = encodeArray(val);
        else if (val instanceof Object || typeof val === "object")
            rdata[key] = encodeData(val);
        else rdata[key] = val;
    });
    return rdata;
};

export const encodeArray = (data: any[]): any[] => {
    return data.map((val: any) => {
        if (val instanceof SMPTE) return (val as SMPTE).toString();
        else if (Array.isArray(val)) return encodeArray(val);
        else if (val instanceof Object || typeof val === "object")
            return encodeData(val);
        else return val;
    });
};
