import {
    MutableClockSource,
    SMPTE,
    getSyncClock,
    ClockState,
    Offset
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { ClockBehaviour, ToTimeSettings } from "./ClockData";

export class TODClockSource implements MutableClockSource {
    constructor(
        owner: string,
        show: string,
        id: string,
        displayName: string,
        automation: boolean,
        settings: ToTimeSettings
    ) {
        this.owner = owner;
        this.show = show;
        this.id = id;
        this.displayName = displayName;
        this.automation = automation;
        this.settings = settings;
    }

    current(): SMPTE {
        if (this.state === ClockState.STOPPED || this.state === ClockState.PAUSED) return this.stopTime;
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

    start(): void {
        if (this.state === ClockState.STOPPED) this.reset();
        if (this.state !== ClockState.RUNNING) {
            EventHandler.emit("clock.start", this.owner, this.show, this.id);
            this.state = ClockState.RUNNING;
        }
    }

    stop(): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.owner, this.show, this.id);
            this.state = ClockState.STOPPED;
            this.stopTime = getSyncClock().current();
        }
    }

    pause(): void {
        if (this.state === ClockState.RUNNING) {
            EventHandler.emit("clock.pause", this.owner, this.show, this.id);
            this.state = ClockState.PAUSED;
            this.stopTime = getSyncClock().current();
        }
    }

    reset(): void {
        if (this.state !== ClockState.STOPPED) this.stop();
        EventHandler.emit("clock.reset", this.owner, this.show, this.id);
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
            EventHandler.emit("clock.complete", this.owner, this.show, this.id);
            this.completed = true;
            if (this.settings.behaviour !== ClockBehaviour.OVERRUN) this.stop();
            else {
                EventHandler.emit(
                    "clock.overrun",
                    this.owner,
                    this.show,
                    this.id
                );
                this.overrun = true;
            }
        }
    }

    data(): object | undefined {
        return { settings: this.settings };
    }

    setData(data: any): void {
        if (data?.displayName as string) this.displayName = data.displayName;
        if (data?.time as string) this.settings.time = new SMPTE(data.time);
        if (data?.behaviour as string) this.settings.behaviour = data.behaviour;
    }

    type: string = "tod";
    show: string;
    owner: string;
    id: string;
    displayName: string;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    automation: boolean;
    private stopTime: SMPTE = new SMPTE();
    private completed: boolean = false;
    private settings: ToTimeSettings;
}
