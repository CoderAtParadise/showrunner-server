import { SMPTE, ClockDirection } from "@coderatparadise/showrunner-common";

export enum ClockBehaviour {
    STOP = "stop",
    OVERRUN = "overrun"
}

export interface TimerSettings {
    direction: ClockDirection;
    behaviour: ClockBehaviour;
    duration: SMPTE;
}

export interface OffsetSettings {
    authority: string;
    behaviour: ClockBehaviour;
    offset: SMPTE;
}

export interface ToTimeSettings {
    behaviour: ClockBehaviour;
    time: SMPTE;
}

export default { ClockBehaviour, ClockDirection };
