import {
    ClockStatus,
    ClockBehaviour,
    SMPTE,
    getSyncClock,
    BaseClockSettings,
    ClockIdentifier,
    ClockSource,
    ControlBar
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { TimerSettings } from "./ClockData";

export class TimerClockSource implements ClockSource<TimerSettings> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & TimerSettings
    ) {
        this.identifier = identifier;
        this._settings = settings;
    }

    status(): ClockStatus {
        return this._status;
    }

    isOverrun(): boolean {
        return this._overrun;
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

    current(): SMPTE {
        if (
            this.status() === ClockStatus.RESET &&
            this._startTimes.length === 0
        )
            return this.duration();
        let currentTime: SMPTE = new SMPTE();
        this._startTimes.forEach((value: SMPTE, index: number) => {
            let end: SMPTE;
            if (
                this._endTimes.length !== this._startTimes.length &&
                index > this._endTimes.length - 1
            )
                end = getSyncClock().current();
            else end = this._endTimes.at(index) as SMPTE;
            if (currentTime.frameCount() === -1)
                currentTime = end.subtract(value, true);
            else currentTime = currentTime.add(end.subtract(value, true));
        });
        return currentTime;
    }

    settings(): BaseClockSettings & TimerSettings {
        return this._settings;
    }

    duration(): SMPTE {
        return this._settings.time;
    }

    play(): void {
        if (this.status() === ClockStatus.STOPPED) this.reset();
        if (this.status() !== ClockStatus.RUNNING) {
            EventHandler.emit("clock.play", this.identifier);
            this._status = ClockStatus.RUNNING;
            this._startTimes.push(getSyncClock().current());
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setTime(time: SMPTE): void {
        // TODO Implement
    }

    stop(): void {
        if (this.status() !== ClockStatus.STOPPED) {
            EventHandler.emit("clock.stop", this.identifier);
            this._status = ClockStatus.STOPPED;
            this._endTimes.push(getSyncClock().current());
        }
    }

    pause(): void {
        if (this.status() === ClockStatus.RUNNING) {
            EventHandler.emit("clock.pause", this.identifier);
            this._status = ClockStatus.PAUSED;
            this._endTimes.push(getSyncClock().current());
        }
    }

    reset(): void {
        if (this.status() !== ClockStatus.STOPPED) this.stop();
        EventHandler.emit("clock.reset", this.identifier);
        this._status = ClockStatus.RESET;
        this._overrun = false;
        this._startTimes.length = 0;
        this._endTimes.length = 0;
    }

    update(): void {
        if (
            this.status() === ClockStatus.RUNNING &&
            !this.isOverrun() &&
            this.current().greaterThanOrEqual(this.settings().time)
        ) {
            EventHandler.emit("clock.complete", this.identifier);
            if (this._settings.behaviour !== ClockBehaviour.OVERRUN)
                this.stop();
            else {
                EventHandler.emit("clock.overrun", this.identifier);
                this._overrun = true;
                this._endTimes.push(getSyncClock().current());
                this._startTimes.push(getSyncClock().current());
            }
        }
    }

    data(): object {
        return {
            _startTimes: this._startTimes,
            _endTimes: this._endTimes
        };
    }

    updateSettings(settings: any): BaseClockSettings & TimerSettings {
        if (settings?.displayName as string)
            this._settings.displayName = settings.displayName;
        if (settings?.time as string)
            this._settings.time = new SMPTE(settings.time);
        if (settings?.behaviour as string)
            this._settings.behaviour = settings.behaviour;
        if (settings?.direction as string)
            this._settings.direction = settings.direction;
        return this._settings;
    }

    type: string = "timer";
    identifier: ClockIdentifier;
    private _status: ClockStatus = ClockStatus.RESET;
    private _overrun: boolean = false;
    private _startTimes: SMPTE[] = [];
    private _endTimes: SMPTE[] = [];
    private _settings: BaseClockSettings & TimerSettings;
}
