import {
    MutableClockSource,
    ClockState,
    SMPTE,
    TimerSettings,
    getSyncClock
} from "@coderatparadise/showrunner-common";
import { Behaviour } from "@coderatparadise/showrunner-common/src/TimerSettings";
import Debug from "debug";

export class TimerClockSource implements MutableClockSource {
    constructor(id: string, display: string, settings: TimerSettings) {
        this.id = id;
        this.display = display;
        this.settings = settings;
    }

    current(): SMPTE {
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
            this.startTimes.push(getSyncClock().current());
            const current = this.current();
            if (this.state === ClockState.STOPPED)
                this.state = ClockState.RUNNING;
            else if (current.greaterThanOrEqual(this.settings.duration))
                this.state = ClockState.OVERRUN;
            else {
                this.state = ClockState.RUNNING;
                this.endTimes.push(
                    getSyncClock()
                        .current()
                        .add(this.settings.duration.subtract(current))
                );
            }
        }
    }

    stop(): void {
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
            this.state = ClockState.PAUSED;
            this.endTimes.push(getSyncClock().current());
        }
    }

    reset(): void {
        this.startTimes.length = 0;
        this.endTimes.length = 0;
        this.state = ClockState.STOPPED;
    }

    update(): void {
        Debug("showrunner:current")(this);
        if (
            this.current().greaterThanOrEqual(this.settings.duration) &&
            this.state === ClockState.RUNNING
        ) {
            if (this.settings.behaviour !== Behaviour.OVERRUN) this.stop();
            else {
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
