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
    const rdata: any[] = [];
    data.forEach((val: any) => {
        if (val instanceof SMPTE) rdata.push((val as SMPTE).toString());
        else if (Array.isArray(val)) rdata.push(encodeArray(val));
        else if (val instanceof Object || typeof val === "object")
            rdata.push(encodeData(val));
        else rdata.push(val);
    });
    return rdata;
};
