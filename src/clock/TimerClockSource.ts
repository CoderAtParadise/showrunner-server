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
        displayName: string,
        automation: boolean,
        settings: TimerSettings
    ) {
        this.owner = owner;
        this.show = show;
        this.id = id;
        this.displayName = displayName;
        this.automation = automation;
        this.settings = settings;
    }

    current(): SMPTE {
        if (this.startTimes.length === 0) return new SMPTE("00:00:00:00");
        let currentTime: SMPTE = new SMPTE();
        this.startTimes.forEach((value: SMPTE, index: number) => {
            let end: SMPTE;
            if (
                this.endTimes.length !== this.startTimes.length &&
                index > this.endTimes.length - 1
            )
                end = getSyncClock().current();
            else end = this.endTimes.at(index) as SMPTE;
            currentTime = currentTime.add(end.subtract(value, true));
        });
        return currentTime;
    }

    start(): void {
        if (this.state === ClockState.STOPPED) this.reset();
        if (this.state !== ClockState.RUNNING) {
            EventHandler.emit("clock.start", this.owner, this.show, this.id);
            this.state = ClockState.RUNNING;
            this.startTimes.push(getSyncClock().current());
        }
    }

    stop(): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.owner, this.show, this.id);
            this.state = ClockState.STOPPED;
            this.endTimes.push(getSyncClock().current());
        }
    }

    pause(): void {
        if (this.state === ClockState.RUNNING) {
            EventHandler.emit("clock.pause", this.owner, this.show, this.id);
            this.state = ClockState.PAUSED;
            this.endTimes.push(getSyncClock().current());
        }
    }

    reset(): void {
        if (this.state !== ClockState.STOPPED) this.stop();
        EventHandler.emit("clock.reset", this.owner, this.show, this.id);
        this.state = ClockState.RESET;
        this.overrun = false;
        this.startTimes.length = 0;
        this.endTimes.length = 0;
    }

    update(): void {
        if (
            this.state === ClockState.RUNNING && !this.overrun &&
            this.current().greaterThan(this.settings.duration)
        ) {
            EventHandler.emit("clock.complete", this.owner, this.show, this.id);
            if (this.settings.behaviour !== ClockBehaviour.OVERRUN) this.stop();
            else {
                EventHandler.emit(
                    "clock.overrun",
                    this.owner,
                    this.show,
                    this.id
                );
                this.overrun = true;
                this.endTimes.push(getSyncClock().current());
                this.startTimes.push(getSyncClock().current());
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
        if (data as string) this.displayName = data;
        if (data?.display as string) this.displayName = data.display;
        if (data as ClockState) this.state = data;
        if (data?.state as ClockState) this.state = data.state;
        if (data as TimerSettings) this.settings = data;
        if (data?.settings as TimerSettings) this.settings = data.settings;
    }

    type: string = "timer";
    show: string;
    owner: string;
    id: string;
    displayName: string;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    automation: boolean;
    startTimes: SMPTE[] = [];
    endTimes: SMPTE[] = [];
    settings: TimerSettings;
}
