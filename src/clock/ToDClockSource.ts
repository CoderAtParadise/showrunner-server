import {
    SMPTE,
    getSyncClock,
    ClockStatus,
    Offset,
    BaseClockSettings,
    ClockIdentifier,
    ClockSource,
    ClockBehaviour,
    ControlBar
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { ClockSettingsBase } from "./ClockData";

export class TODClockSource implements ClockSource<ClockSettingsBase> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & ClockSettingsBase
    ) {
        this.identifier = identifier;
        this._settings = settings;
    }

    status(): ClockStatus {
        return this._status;
    }

    displayName(): string {
        return this._settings.displayName;
    }

    controlBar(): ControlBar[] {
        return [ControlBar.PLAY_PAUSE, ControlBar.STOP, ControlBar.RESET];
    }

    hasIncorrectFrameRate(): boolean {
        return false;
    }

    isOverrun(): boolean {
        return this._overrun;
    }

    settings(): BaseClockSettings & ClockSettingsBase {
        return this._settings;
    }

    current(): SMPTE {
        if (
            this.status() === ClockStatus.STOPPED ||
            this.status() === ClockStatus.PAUSED
        )
            return this._stopTime;
        if (this.status() === ClockStatus.RESET) return this._settings.time;
        if (this._complete) {
            if (this._overrun) {
                return getSyncClock()
                    .current()
                    .subtract(this._settings.time, true)
                    .setOffset(Offset.START);
            } else return new SMPTE("00:00:00:00");
        }
        return this._settings.time
            .subtract(getSyncClock().current(), true)
            .setOffset(Offset.END);
    }

    duration(): SMPTE {
        return this._settings.time;
    }

    play(): void {
        if (this.status() === ClockStatus.STOPPED) this.reset();
        if (this._status !== ClockStatus.RUNNING) {
            EventHandler.emit("clock.play", this.identifier);
            this._status = ClockStatus.RUNNING;
        }
    }

    setTime(): void {
        // NOOP
    }

    stop(): void {
        if (this._status !== ClockStatus.STOPPED) {
            EventHandler.emit("clock.stop", this.identifier);
            this._status = ClockStatus.STOPPED;
            this._stopTime = getSyncClock().current();
        }
    }

    pause(): void {
        if (this.status() === ClockStatus.RUNNING) {
            EventHandler.emit("clock.pause", this.identifier);
            this._status = ClockStatus.PAUSED;
            this._stopTime = getSyncClock().current();
        }
    }

    reset(): void {
        if (this._status !== ClockStatus.STOPPED) this.stop();
        EventHandler.emit("clock.reset", this.identifier);
        this._status = ClockStatus.RESET;
        this._overrun = false;
        this._complete = false;
        this._stopTime = new SMPTE();
    }

    update(): void {
        if (
            this.status() === ClockStatus.RUNNING &&
            !this._overrun &&
            getSyncClock().current().greaterThanOrEqual(this._settings.time)
        ) {
            EventHandler.emit("clock.complete", this.identifier);
            this._complete = true;
            if (this._settings.behaviour !== ClockBehaviour.OVERRUN)
                this.stop();
            else {
                EventHandler.emit("clock.overrun", this.identifier);
                this._overrun = true;
            }
        }
    }

    updateSettings(settings: any): BaseClockSettings & ClockSettingsBase {
        if (settings?.displayName as string)
            this._settings.displayName = settings.displayName;
        if (settings?.time as string) this._settings.time = new SMPTE(settings.time);
        if (settings?.behaviour as string)
            this._settings.behaviour = settings.behaviour;
        return this._settings;
    }

    data(): object {
        return {};
    }

    type: string = "tod";
    identifier: ClockIdentifier;
    private _status: ClockStatus = ClockStatus.RESET;
    private _overrun: boolean = false;
    private _stopTime: SMPTE = new SMPTE();
    private _complete: boolean = false;
    private _settings: BaseClockSettings & ClockSettingsBase;
}
