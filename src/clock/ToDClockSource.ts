import {
    MutableClockSource,
    SMPTE,
    getSyncClock,
    ClockState,
    Offset,
    BaseClockSettings,
    ClockIdentifier
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { ClockBehaviour, ClockSettingsBase } from "./ClockData";

export class TODClockSource implements MutableClockSource<ClockSettingsBase> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & ClockSettingsBase
    ) {
        this.identifier = identifier;
        this.settings = settings;
    }

    incorrectFramerate(): boolean {
        return false;
    }

    current(): SMPTE {
        if (
            this.state === ClockState.STOPPED ||
            this.state === ClockState.PAUSED
        )
            return this.stopTime;
        if (this.state === ClockState.RESET) return this.settings.time;
        if (this.completed) {
            if (this.overrun) {
                return getSyncClock()
                    .current()
                    .subtract(this.settings.time, true)
                    .setOffset(Offset.START);
            } else return new SMPTE("00:00:00:00");
        }
        return this.settings.time
            .subtract(getSyncClock().current(), true)
            .setOffset(Offset.END);
    }

    duration(): SMPTE {
        return this.settings.time;
    }

    start(): void {
        if (this.state === ClockState.STOPPED) this.reset();
        if (this.state !== ClockState.RUNNING) {
            EventHandler.emit("clock.start", this.identifier);
            this.state = ClockState.RUNNING;
        }
    }

    setTime(time: SMPTE): void {}

    stop(): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.identifier);
            this.state = ClockState.STOPPED;
            this.stopTime = getSyncClock().current();
        }
    }

    pause(): void {
        if (this.state === ClockState.RUNNING) {
            EventHandler.emit("clock.pause", this.identifier);
            this.state = ClockState.PAUSED;
            this.stopTime = getSyncClock().current();
        }
    }

    reset(): void {
        if (this.state !== ClockState.STOPPED) this.stop();
        EventHandler.emit("clock.reset", this.identifier);
        this.state = ClockState.RESET;
        this.overrun = false;
        this.completed = false;
        this.stopTime = new SMPTE();
    }

    update(): void {
        if (
            this.state === ClockState.RUNNING &&
            !this.overrun &&
            getSyncClock().current().greaterThanOrEqual(this.settings.time)
        ) {
            EventHandler.emit("clock.complete", this.identifier);
            this.completed = true;
            if (this.settings.behaviour !== ClockBehaviour.OVERRUN) this.stop();
            else {
                EventHandler.emit("clock.overrun", this.identifier);
                this.overrun = true;
            }
        }
    }

    setData(data: any): void {
        if (data?.displayName as string)
            this.settings.displayName = data.displayName;
        if (data?.time as string) this.settings.time = new SMPTE(data.time);
        if (data?.behaviour as string) this.settings.behaviour = data.behaviour;
    }

    type: string = "tod";
    identifier: ClockIdentifier;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    private stopTime: SMPTE = new SMPTE();
    private completed: boolean = false;
    settings: BaseClockSettings & ClockSettingsBase;
}
