import { SMPTE, ClockDirection } from "@coderatparadise/showrunner-common";

export enum ClockBehaviour {
    STOP = "stop",
    OVERRUN = "overrun"
}

export interface ClockSettingsBase {
    behaviour: ClockBehaviour;
    time: SMPTE;
}

export interface TimerSettings extends ClockSettingsBase {
    direction: ClockDirection;
}

export interface OffsetSettings extends ClockSettingsBase {
    authority: string;
    time: SMPTE;
    direction: ClockDirection;
}

export interface VideoClockSettings {
    source: string;
    id: string;
}

export default { ClockBehaviour, ClockDirection };
