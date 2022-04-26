import {
    MutableClockSource,
    SMPTE,
    ClockState,
    ShowHandler,
    Offset
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { ClockBehaviour, OffsetSettings, TimerSettings } from "./ClockData";

export class OffsetClockSource implements MutableClockSource<OffsetSettings> {
    constructor(
        owner: string,
        id: string,
        displayName: string,
        automation: boolean,
        settings: OffsetSettings
    ) {
        this.owner = owner;
        this.id = id;
        this.settings = { displayName: displayName, ...settings };
        this.automation = automation;
    }

    current(): SMPTE {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.settings.authority
        );
        if (authClock && authClock.type === "timer") {
            const settings = (authClock.data() as any)!
                .settings as TimerSettings;
            if (
                (authClock.state !== ClockState.STOPPED &&
                    this.state === ClockState.STOPPED) ||
                (authClock.current().greaterThan(this.settings.time, true) &&
                    this.settings.behaviour === ClockBehaviour.STOP)
            )
                return new SMPTE("00:00:00:00");
            if (this.state === ClockState.RESET) {
                switch (this.settings.time.offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        return new SMPTE(this.settings.time).setOffset(
                            Offset.END
                        );
                    case Offset.END:
                        return settings.time
                            .subtract(this.settings.time, true)
                            .setOffset(Offset.END);
                }
            }
            const difference = settings.time.subtract(this.settings.time, true);
            switch (this.settings.time.offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (this.stopTime.lessThanOrEqual(difference, true)) {
                            return settings.time
                                .subtract(this.stopTime, true)
                                .subtract(this.settings.time, true)
                                .setOffset(Offset.END);
                        }
                        return this.stopTime
                            .subtract(settings.time, true)
                            .add(this.settings.time, true)
                            .setOffset(Offset.START);
                    }
                    if (
                        authClock
                            .current()
                            .greaterThanOrEqual(this.settings.time, true)
                    ) {
                        return authClock
                            .current()
                            .subtract(this.settings.time, true)
                            .setOffset(Offset.START);
                    }
                    return this.settings.time
                        .subtract(authClock.current(), true)
                        .setOffset(Offset.END);
                case Offset.END:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (this.stopTime.lessThanOrEqual(difference, true)) {
                            return settings.time
                                .subtract(this.stopTime, true)
                                .subtract(this.settings.time, true)
                                .setOffset(Offset.END);
                        }
                        return this.stopTime
                            .subtract(settings.time, true)
                            .add(this.settings.time, true)
                            .setOffset(Offset.START);
                    }
                    if (
                        authClock.current().greaterThanOrEqual(difference, true)
                    ) {
                        return authClock
                            .current()
                            .subtract(difference, true)
                            .setOffset(Offset.START);
                    }
                    return difference
                        .subtract(authClock.current(), true)
                        .setOffset(Offset.END);
            }
        }
        return new SMPTE();
    }

    duration(): SMPTE {
        return this.settings.time;
    }

    start(): void {
        if (this.state === ClockState.STOPPED) this.reset(false);
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.settings.authority
        );
        if (authClock && authClock.type === "timer") {
            if (authClock.state === ClockState.RUNNING) {
                this.state = ClockState.RUNNING;
                EventHandler.emit("clock.start", this.owner, this.id);
                this.override = false;
            }
        }
    }

    stop(override: boolean): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.owner, this.id);
            this.state = ClockState.STOPPED;
            this.stopTime =
                this.getHandler()
                    ?.getValue("clocks", this.settings.authority)
                    ?.current() || new SMPTE();
            if (override) this.override = true;
        }
    }

    pause(override: boolean): void {
        if (this.state === ClockState.RUNNING) {
            this.state = ClockState.PAUSED;
            EventHandler.emit("clock.pause", this.owner, this.id);
            this.stopTime =
                this.getHandler()
                    ?.getValue("clocks", this.settings.authority)
                    ?.current() || new SMPTE();
            if (override) this.override = true;
        }
    }

    reset(override: boolean): void {
        if (this.state !== ClockState.STOPPED) this.stop(override);
        EventHandler.emit("clock.reset", this.owner, this.id);
        this.overrun = false;
        this.state = ClockState.RESET;
        this.complete = false;
        if (override) this.override = true;
    }

    update(): void {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.settings.authority
        );
        if (authClock && authClock.type === "timer") {
            if (this.lastParentState !== authClock.state)
                this.lastParentState = authClock.state;
            switch (this.lastParentState) {
                case ClockState.RESET:
                    if (
                        this.state !== ClockState.RESET &&
                        this.automation &&
                        !this.override
                    )
                        this.reset(false);
                    break;
                case ClockState.STOPPED:
                    if (
                        this.state !== ClockState.STOPPED &&
                        this.automation &&
                        !this.override
                    )
                        this.stop(false);
                    break;
                case ClockState.PAUSED:
                    if (
                        this.state !== ClockState.PAUSED &&
                        this.automation &&
                        !this.override
                    )
                        this.pause(false);
                    break;
                case ClockState.RUNNING:
                    if (
                        this.state !== ClockState.RUNNING &&
                        this.automation &&
                        !this.complete &&
                        !this.override
                    )
                        this.start();
            }
            if (this.state === ClockState.RUNNING && !this.overrun) {
                const settings = (authClock.data() as any)!
                    .settings as TimerSettings;
                const end =
                    this.settings.time.offset() === Offset.END
                        ? settings.time.subtract(this.settings.time, true)
                        : this.settings.time;
                if (authClock.current().greaterThanOrEqual(end)) {
                    this.complete = true;
                    EventHandler.emit("clock.complete", this.owner, this.id);
                    if (this.settings.behaviour !== ClockBehaviour.OVERRUN)
                        this.stop(false);
                    else {
                        EventHandler.emit("clock.overrun", this.owner, this.id);
                        this.overrun = true;
                    }
                }
            }
        }
    }

    public setData(data: any) {
        if (data?.displayName as string)
            this.settings.displayName = data.displayName;
        if (data?.time as string) this.settings.time = new SMPTE(data.time);
        if (data?.behaviour as string) this.settings.behaviour = data.behaviour;
    }

    private getHandler(): ShowHandler | undefined {
        return globalShowHandler(); // TODO undate to actually get show
    }

    type: string = "time";
    owner: string;
    id: string;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    automation: boolean;
    private stopTime: SMPTE = new SMPTE();
    private lastParentState: ClockState = ClockState.RESET;
    private complete: boolean = false;
    private override: boolean = false;
    settings: { displayName: string } & OffsetSettings;
}
