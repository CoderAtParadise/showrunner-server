import {
    MutableClockSource,
    SMPTE,
    getSyncClock,
    ClockState
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { ClockBehaviour, ToTimeSettings } from "./ClockData";

export class ToTimeClockSource implements MutableClockSource {
    constructor(
        owner: string,
        show: string,
        id: string,
        display: string,
        settings: ToTimeSettings
    ) {
        this.owner = owner;
        this.show = show;
        this.id = id;
        this.display = display;
        this.settings = settings;
    }

    current(): SMPTE {
        return this.settings.time.subtract(getSyncClock().current());
    }

    start(): void {
        if (
            this.state !== ClockState.RUNNING &&
            this.state !== ClockState.OVERRUN
        ) {
            EventHandler.emit("clock.start", this.owner, this.show, this.id);
            this.state = ClockState.RUNNING;
        }
    }

    stop(): void {
        if (
            this.state !== ClockState.STOPPED &&
            this.state !== ClockState.HIDDEN
        ) {
            EventHandler.emit("clock.stop", this.owner, this.show, this.id);
            this.state = ClockState.STOPPED;
        }
    }

    pause(): void {
        if (
            this.state === ClockState.RUNNING ||
            this.state === ClockState.OVERRUN
        ) {
            EventHandler.emit("clock.pause", this.owner, this.show, this.id);
            this.state = ClockState.PAUSED;
        }
    }

    reset(): void {
        this.stop();
        EventHandler.emit("clock.reset", this.owner, this.show, this.id);
    }

    update(): void {
        if (
            this.state === ClockState.RUNNING &&
            getSyncClock().current().greaterThanOrEqual(this.settings.time)
        ) {
            EventHandler.emit("clock.complete", this.owner, this.show, this.id);
            if (this.settings.behaviour !== ClockBehaviour.OVERRUN) this.stop();
            else {
                EventHandler.emit("clock.overrun", this.owner, this.show, this.id);
                this.state = ClockState.OVERRUN;
            }
        }
    }

    data(): object | undefined {
        return { settings: this.settings };
    }

    setData(data: any): void {
        if (data as ToTimeSettings) this.settings = data;
        if (data?.settings as ToTimeSettings) this.settings = data.settings;
    }

    type: string = "toTime";
    show: string;
    owner: string;
    id: string;
    display: string;
    state: ClockState = ClockState.STOPPED;
    private settings: ToTimeSettings;
}
