import {
    SMPTE,
    ClockDirection,
    ClockBehaviour
} from "@coderatparadise/showrunner-common";

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
}

export interface VideoClockSettings {
    source: string;
    id: string;
}

export default { ClockBehaviour, ClockDirection };
