import {
    MutableClockSource,
    SMPTE,
    ClockState,
    ShowHandler,
    Offset,
    BaseClockSettings,
    ClockIdentifier,
    ClockSource
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { ClockBehaviour, OffsetSettings } from "./ClockData";

export class OffsetClockSource implements MutableClockSource<OffsetSettings> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & OffsetSettings
    ) {
        this.identifier = identifier;
        this.settings = settings;
    }

    incorrectFramerate(): boolean {
        return false;
    }

    current(): SMPTE {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        ) as ClockSource<any>;
        if (authClock) {
            if (
                (authClock.state !== ClockState.STOPPED &&
                    this.state === ClockState.STOPPED) ||
                (authClock.current().greaterThan(this.duration(), true) &&
                    this.settings.behaviour === ClockBehaviour.STOP)
            )
                return new SMPTE("00:00:00:00");
            if (this.state === ClockState.RESET) {
                switch (this.duration().offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        return new SMPTE(this.duration()).setOffset(Offset.END);
                    case Offset.END:
                        return authClock.duration()
                            .subtract(this.duration(), true)
                            .setOffset(Offset.END);
                }
            }
            const difference = authClock.duration().subtract(this.duration(), true);
            switch (this.duration().offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (this.stopTime.lessThanOrEqual(difference, true)) {
                            return authClock.duration()
                                .subtract(this.stopTime, true)
                                .subtract(this.duration(), true)
                                .setOffset(Offset.END);
                        }
                        return this.stopTime
                            .subtract(authClock.duration(), true)
                            .add(this.duration(), true)
                            .setOffset(Offset.START);
                    }
                    if (
                        authClock
                            .current()
                            .greaterThanOrEqual(this.duration(), true)
                    ) {
                        return authClock
                            .current()
                            .subtract(this.duration(), true)
                            .setOffset(Offset.START);
                    }
                    return this.duration()
                        .subtract(authClock.current(), true)
                        .setOffset(Offset.END);
                case Offset.END:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (this.stopTime.lessThanOrEqual(difference, true)) {
                            return authClock.duration()
                                .subtract(this.stopTime, true)
                                .subtract(this.duration(), true)
                                .setOffset(Offset.END);
                        }
                        return this.stopTime
                            .subtract(authClock.duration(), true)
                            .add(this.duration(), true)
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
            this.authority().id
        );
        if (authClock) {
            if (authClock.state === ClockState.RUNNING) {
                this.state = ClockState.RUNNING;
                EventHandler.emit("clock.start", this.identifier);
                this.override = false;
            }
        }
    }

    setTime(time: SMPTE): void {}

    stop(override: boolean): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.identifier);
            this.state = ClockState.STOPPED;
            this.stopTime =
                this.getHandler()
                    ?.getValue("clocks", this.authority().id)
                    ?.current() || new SMPTE();
            if (override) this.override = true;
        }
    }

    pause(override: boolean): void {
        if (this.state === ClockState.RUNNING) {
            this.state = ClockState.PAUSED;
            EventHandler.emit("clock.pause", this.identifier);
            this.stopTime =
                this.getHandler()
                    ?.getValue("clocks", this.authority().id)
                    ?.current() || new SMPTE();
            if (override) this.override = true;
        }
    }

    reset(override: boolean): void {
        if (this.state !== ClockState.STOPPED) this.stop(override);
        EventHandler.emit("clock.reset", this.identifier);
        this.overrun = false;
        this.state = ClockState.RESET;
        this.complete = false;
        if (override) this.override = true;
    }

    update(): void {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        );
        if (authClock) {
            if (this.lastParentState !== authClock.state)
                this.lastParentState = authClock.state;
            switch (this.lastParentState) {
                case ClockState.RESET:
                    if (
                        this.state !== ClockState.RESET &&
                        this.settings.automation &&
                        !this.override
                    )
                        this.reset(false);
                    break;
                case ClockState.STOPPED:
                    if (
                        this.state !== ClockState.STOPPED &&
                        this.settings.automation &&
                        !this.override
                    )
                        this.stop(false);
                    break;
                case ClockState.PAUSED:
                    if (
                        this.state !== ClockState.PAUSED &&
                        this.settings.automation &&
                        !this.override
                    )
                        this.pause(false);
                    break;
                case ClockState.RUNNING:
                    if (
                        this.state !== ClockState.RUNNING &&
                        this.settings.automation &&
                        !this.complete &&
                        !this.override
                    )
                        this.start();
            }
            if (this.state === ClockState.RUNNING && !this.overrun) {
                const end =
                    this.duration().offset() === Offset.END
                        ? authClock.duration().subtract(this.duration(), true)
                        : this.duration();
                if (authClock.current().greaterThanOrEqual(end)) {
                    this.complete = true;
                    EventHandler.emit("clock.complete", this.identifier);
                    if (this.settings.behaviour !== ClockBehaviour.OVERRUN)
                        this.stop(false);
                    else {
                        EventHandler.emit("clock.overrun", this.identifier);
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

    private authority(): ClockIdentifier {
        if (
            this.mauthority !== undefined &&
            `${this.mauthority.show}:${this.mauthority.session}:${this.mauthority.id}` ===
                this.settings.authority
        )
            return this.mauthority;
        else {
            const split = this.settings.authority.split(":");
            this.mauthority = {
                show: split[0],
                session: split[1],
                id: split[2],
                owner: ""
            };
            return this.mauthority;
        }
    }

    type: string = "offset";
    identifier: ClockIdentifier;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    private stopTime: SMPTE = new SMPTE();
    private lastParentState: ClockState = ClockState.RESET;
    private complete: boolean = false;
    private override: boolean = false;
    private mauthority: ClockIdentifier | undefined;
    settings: BaseClockSettings & OffsetSettings;
}
