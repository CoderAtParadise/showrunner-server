import {
    MutableClockSource,
    ClockState,
    SMPTE,
    TimerSettings,
    Behaviour,
    getSyncClock
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "./Scheduler";

export class TimerClockSource implements MutableClockSource {
    constructor(id: string, display: string, settings: TimerSettings) {
        this.id = id;
        this.display = display;
        this.settings = settings;
    }

    current(): SMPTE {
        if (this.startTimes.length === 0) return new SMPTE();
        let currentTime: SMPTE = new SMPTE();
        this.startTimes.forEach((value: SMPTE, index: number) => {
            let end: SMPTE;
            if (this.endTimes.length !== this.startTimes.length)
                end = getSyncClock().current();
            else end = this.endTimes.at(index) as SMPTE;
            currentTime = currentTime.add(end.subtract(value));
        });
        return currentTime;
    }

    start(): void {
        if (
            this.state === ClockState.STOPPED ||
            this.state === ClockState.HIDDEN
        )
            this.reset();
        if (
            this.state !== ClockState.RUNNING &&
            this.state !== ClockState.OVERRUN
        ) {
            EventHandler.emit("timer.start", this.id);
            if (this.state === ClockState.STOPPED)
                this.state = ClockState.RUNNING;
            else if (this.current().greaterThanOrEqual(this.settings.duration))
                this.state = ClockState.OVERRUN;
            this.startTimes.push(getSyncClock().current());
        }
    }

    stop(): void {
        EventHandler.emit("timer.stop", this.id);
        if (
            this.state !== ClockState.HIDDEN &&
            this.state !== ClockState.STOPPED
        ) {
            if (this.settings.behaviour === Behaviour.HIDE)
                this.state = ClockState.HIDDEN;
            else this.state = ClockState.STOPPED;
            if (this.endTimes.length === this.startTimes.length) {
                this.endTimes[this.endTimes.length - 1] =
                    getSyncClock().current();
            } else this.endTimes.push(getSyncClock().current());
        }
    }

    pause(): void {
        if (
            this.state === ClockState.RUNNING ||
            this.state === ClockState.OVERRUN
        ) {
            EventHandler.emit("timer.pause", this.id);
            this.state = ClockState.PAUSED;
            this.endTimes.push(getSyncClock().current());
        }
    }

    reset(): void {
        EventHandler.emit("timer.reset", this.id);
        this.startTimes.length = 0;
        this.endTimes.length = 0;
        this.state = ClockState.STOPPED;
    }

    update(): void {
        if (
            this.current().greaterThanOrEqual(this.settings.duration) &&
            this.state === ClockState.RUNNING
        ) {
            EventHandler.emit("timer.complete", this.id);
            if (this.settings.behaviour !== Behaviour.OVERRUN) this.stop();
            else {
                EventHandler.emit("timer.overrun", this.id);
                this.state = ClockState.OVERRUN;
                this.endTimes[this.endTimes.length - 1] =
                    getSyncClock().current();
                this.startTimes.push(
                    getSyncClock().current().add(new SMPTE("00:00:01:00"))
                );
            }
        }
    }

    data(): object | undefined {
        return {
            startTimes: this.startTimes,
            endTimes: this.endTimes,
            settings: this.settings
        };
    }

    setData(data: any): void {
        if (data as string) this.display = data;
        if (data?.display as string) this.display = data.display;
        if (data as ClockState) this.state = data;
        if (data?.state as ClockState) this.state = data.state;
        if (data as TimerSettings) this.settings = data;
        if (data?.settings as TimerSettings) this.settings = data.settings;
    }

    id: string;
    display: string;
    state: ClockState = ClockState.STOPPED;
    startTimes: SMPTE[] = [];
    endTimes: SMPTE[] = [];
    settings: TimerSettings;
}
