export interface ClockCommandData {
    id: string;
}

export function isClockCommandData(data: any): data is ClockCommandData {
    return data.id !== undefined;
}
