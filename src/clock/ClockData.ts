import { SMPTE } from "@coderatparadise/showrunner-common";

export enum ClockBehaviour {
    STOP = "stop",
    HIDE = "hide",
    OVERRUN = "overrun"
}

export enum ClockDirection {
    COUNTDOWN = "countdown",
    COUNTUP = "countup"
}

export interface TimerSettings {
    direction: ClockDirection;
    behaviour: ClockBehaviour;
    duration: SMPTE;
}

export interface OffsetSettings {
    authority: string;
    offset: SMPTE;
}

export interface ToTimeSettings {
    behaviour: ClockBehaviour;
    time: SMPTE;
}

export default { ClockBehaviour, ClockDirection };
