export interface ClockCommandData {
    show: string;
    id: string;
}

export function isClockCommandData(data: any): data is ClockCommandData {
    return data.show !== undefined && data.id !== undefined;
}
