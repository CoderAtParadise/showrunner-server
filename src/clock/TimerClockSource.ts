import {
    MutableClockSource,
    ClockState,
    SMPTE,
    getSyncClock
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { ClockBehaviour, TimerSettings } from "./ClockData";

export class TimerClockSource implements MutableClockSource<TimerSettings> {
    constructor(
        owner: string,
        id: string,
        displayName: string,
        automation: boolean,
        settings: TimerSettings
    ) {
        this.owner = owner;
        this.id = id;
        this.automation = automation;
        this.settings = { displayName: displayName, ...settings };
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

    duration(): SMPTE {
        return this.settings.time;
    }

    start(): void {
        if (this.state === ClockState.STOPPED) this.reset();
        if (this.state !== ClockState.RUNNING) {
            EventHandler.emit("clock.start", this.owner, this.id);
            this.state = ClockState.RUNNING;
            this.startTimes.push(getSyncClock().current());
        }
    }

    stop(): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.owner, this.id);
            this.state = ClockState.STOPPED;
            this.endTimes.push(getSyncClock().current());
        }
    }

    pause(): void {
        if (this.state === ClockState.RUNNING) {
            EventHandler.emit("clock.pause", this.owner, this.id);
            this.state = ClockState.PAUSED;
            this.endTimes.push(getSyncClock().current());
        }
    }

    reset(): void {
        if (this.state !== ClockState.STOPPED) this.stop();
        EventHandler.emit("clock.reset", this.owner, this.id);
        this.state = ClockState.RESET;
        this.overrun = false;
        this.automation = false;
        this.startTimes.length = 0;
        this.endTimes.length = 0;
    }

    update(): void {
        if (
            this.state === ClockState.RUNNING &&
            !this.overrun &&
            this.current().greaterThan(this.settings.time)
        ) {
            EventHandler.emit("clock.complete", this.owner, this.id);
            if (this.settings.behaviour !== ClockBehaviour.OVERRUN) this.stop();
            else {
                EventHandler.emit("clock.overrun", this.owner, this.id);
                this.overrun = true;
                this.endTimes.push(getSyncClock().current());
                this.startTimes.push(getSyncClock().current());
            }
        }
    }

    data(): object {
        return {
            startTimes: this.startTimes,
            endTimes: this.endTimes
        };
    }

    setData(data: any): void {
        if (data?.displayName as string)
            this.settings.displayName = data.displayName;
        if (data?.time as string) this.settings.time = new SMPTE(data.time);
        if (data?.behaviour as string) this.settings.behaviour = data.behaviour;
        if (data?.direction as string) this.settings.direction = data.direction;
    }

    type: string = "timer";
    owner: string;
    id: string;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    automation: boolean;
    startTimes: SMPTE[] = [];
    endTimes: SMPTE[] = [];
    settings: { displayName: string } & TimerSettings;
}
