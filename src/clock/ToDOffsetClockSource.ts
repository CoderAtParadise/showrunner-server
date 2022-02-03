import {
    ClockState,
    getSyncClock,
    MutableClockSource,
    Offset,
    ShowHandler,
    SMPTE
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { ClockBehaviour, OffsetSettings, ToTimeSettings } from "./ClockData";

export class TODOffsetClockSource implements MutableClockSource {
    constructor(
        owner: string,
        show: string,
        id: string,
        displayName: string,
        automation: boolean,
        settings: OffsetSettings
    ) {
        this.owner = owner;
        this.show = show;
        this.id = id;
        this.displayName = displayName;
        this.automation = automation;
        this.settings = settings;
    }

    current(): SMPTE {
        const authClock = this.getHandler()?.getClock(this.settings.authority);
        if (authClock && authClock.type === "tod") {
            const settings = (authClock.data() as any)!
                .settings as ToTimeSettings;
            if (
                this.settings.behaviour === ClockBehaviour.STOP &&
                this.state === ClockState.STOPPED
            )
                return new SMPTE("00:00:00:00");
            if (this.state === ClockState.RESET) {
                switch (this.settings.offset.offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        return new SMPTE(this.settings.offset).setOffset(
                            Offset.START
                        );
                    case Offset.END:
                        return new SMPTE(this.settings.offset).setOffset(
                            Offset.END
                        );
                }
            }
            switch (this.settings.offset.offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (
                            this.stopTime.lessThanOrEqual(settings.time, true)
                        ) {
                            return settings.time
                                .subtract(this.stopTime, true)
                                .add(this.settings.offset, true)
                                .setOffset(Offset.END);
                        }
                        return this.stopTime
                            .subtract(settings.time, true)
                            .subtract(this.settings.offset, true)
                            .setOffset(Offset.START);
                    }
                    if (
                        getSyncClock()
                            .current()
                            .greaterThanOrEqual(settings.time, true)
                    ) {
                        return authClock
                            .current()
                            .subtract(this.settings.offset, true)
                            .setOffset(Offset.START);
                    } else {
                        const c = authClock.current().add(this.settings.offset);
                        c.setOffset(Offset.END);
                        return c;
                    }
                case Offset.END:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (
                            this.stopTime.lessThanOrEqual(settings.time, true)
                        ) {
                            return settings.time
                                .subtract(this.stopTime, true)
                                .subtract(this.settings.offset, true)
                                .setOffset(Offset.END);
                        }
                        return this.stopTime
                            .subtract(settings.time, true)
                            .add(this.settings.offset, true)
                            .setOffset(Offset.START);
                    }
                    if (
                        getSyncClock()
                            .current()
                            .greaterThanOrEqual(settings.time, true)
                    ) {
                        return authClock
                            .current()
                            .add(this.settings.offset, true)
                            .setOffset(Offset.START);
                    } else {
                        const current = authClock.current();
                        if (
                            current.lessThanOrEqual(this.settings.offset, true)
                        ) {
                            return this.settings.offset
                                .subtract(current)
                                .setOffset(Offset.START);
                        } else {
                            return authClock
                                .current()
                                .subtract(this.settings.offset)
                                .setOffset(Offset.END);
                        }
                    }
            }
        }
        return new SMPTE();
    }

    start(): void {
        if (this.state === ClockState.STOPPED) this.reset(false);
        const authClock = this.getHandler()?.getClock(this.settings.authority);
        if (authClock && authClock.type === "tod") {
            if (authClock.state === ClockState.RUNNING) {
                this.state = ClockState.RUNNING;
                EventHandler.emit(
                    "clock.start",
                    this.owner,
                    this.show,
                    this.id
                );
                this.override = false;
            }
        }
    }

    stop(override: boolean): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.owner, this.show, this.id);
            this.state = ClockState.STOPPED;
            this.stopTime = getSyncClock().current();
            if (override) this.override = true;
        }
    }

    pause(override:boolean): void {
        if (this.state === ClockState.RUNNING) {
            EventHandler.emit("clock.pause", this.owner, this.show, this.id);
            this.state = ClockState.PAUSED;
            this.stopTime = getSyncClock().current();
            if (override) this.override = true;
        }
    }

    reset(override:boolean): void {
        if (this.state !== ClockState.STOPPED) this.stop(override);
        EventHandler.emit("clock.reset", this.owner, this.show, this.id);
        this.state = ClockState.RESET;
        this.overrun = false;
        this.complete = true;
        this.stopTime = new SMPTE();
        if (override) this.override = true;
    }

    update(): void {
        const authClock = this.getHandler()?.getClock(this.settings.authority);
        if (authClock && authClock.type === "tod") {
            if (this.lastParentState !== authClock.state)
                this.lastParentState = authClock.state;
            switch (this.lastParentState) {
                case ClockState.RESET:
                    if (this.state !== ClockState.RESET && this.automation && !this.override)
                        this.reset(false);
                    break;
                case ClockState.STOPPED:
                    if (this.state !== ClockState.STOPPED && this.automation && !this.override)
                        this.stop(false);
                    break;
                case ClockState.PAUSED:
                    if (this.state !== ClockState.PAUSED && this.automation && !this.override)
                        this.pause(false);
                    break;
                case ClockState.RUNNING:
                    if (this.state !== ClockState.RUNNING && this.automation && !this.complete && !this.override)
                        this.start();
                    break;
            }
            if (this.state === ClockState.RUNNING && !this.overrun) {
                const settings = (authClock.data() as any)!
                    .settings as ToTimeSettings;
                const end =
                    this.settings.offset.offset() === Offset.END
                        ? settings.time.subtract(this.settings.offset, true)
                        : settings.time.add(this.settings.offset, true);
                if (getSyncClock().current().greaterThanOrEqual(end)) {
                    this.complete = true;
                    EventHandler.emit(
                        "clock.complete",
                        this.owner,
                        this.show,
                        this.id
                    );
                    if (this.settings.behaviour !== ClockBehaviour.OVERRUN)
                        this.stop(false);
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
        }
    }

    data(): object | undefined {
        return { show: this.show, settings: this.settings };
    }

    setData(data: any): void {
        if (data?.displayName as string) this.displayName = data.displayName;
        if (data?.time as string) this.settings.offset = new SMPTE(data.time);
        if (data?.behaviour as string) this.settings.behaviour = data.behaviour;
    }

    private getHandler(): ShowHandler | undefined {
        return globalShowHandler();
    }

    type: string = "tod:offset";
    owner: string;
    show: string;
    id: string;
    displayName: string;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    automation: boolean;
    private lastParentState: ClockState = ClockState.RESET;
    private stopTime: SMPTE = new SMPTE();
    private override: boolean = false;
    private complete: boolean = false;
    private settings: OffsetSettings;
}
