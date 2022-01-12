import {
    MutableClockSource,
    ClockState,
    SMPTE,
    getSyncClock
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { ClockBehaviour, TimerSettings } from "./ClockData";

export class TimerClockSource implements MutableClockSource {
    constructor(
        owner: string,
        show: string,
        id: string,
        display: string,
        settings: TimerSettings
    ) {
        this.owner = owner;
        this.show = show;
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
            EventHandler.emit("clock.start", this.owner, this.show, this.id);
            if (this.state === ClockState.STOPPED)
                this.state = ClockState.RUNNING;
            else if (this.current().greaterThanOrEqual(this.settings.duration))
                this.state = ClockState.OVERRUN;
            this.startTimes.push(getSyncClock().current());
        }
    }

    stop(): void {
        if (
            this.state !== ClockState.HIDDEN &&
            this.state !== ClockState.STOPPED
        ) {
            EventHandler.emit("clock.stop", this.owner, this.show, this.id);
            if (this.settings.behaviour === ClockBehaviour.HIDE)
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
            EventHandler.emit("clock.pause", this.owner, this.show, this.id);
            this.state = ClockState.PAUSED;
            this.endTimes.push(getSyncClock().current());
        }
    }

    reset(): void {
        this.stop();
        EventHandler.emit("clock.reset", this.owner, this.show, this.id);
        this.startTimes.length = 0;
        this.endTimes.length = 0;
    }

    update(): void {
        if (
            this.state === ClockState.RUNNING &&
            this.current().greaterThanOrEqual(this.settings.duration)
        ) {
            EventHandler.emit("clock.complete", this.owner, this.show, this.id);
            if (this.settings.behaviour !== ClockBehaviour.OVERRUN) this.stop();
            else {
                EventHandler.emit("clock.overrun", this.owner, this.show, this.id);
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

    type: string = "timer";
    show: string;
    owner: string;
    id: string;
    display: string;
    state: ClockState = ClockState.STOPPED;
    startTimes: SMPTE[] = [];
    endTimes: SMPTE[] = [];
    settings: TimerSettings;
}
