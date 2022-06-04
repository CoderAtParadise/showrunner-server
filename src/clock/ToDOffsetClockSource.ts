import {
    ClockState,
    getSyncClock,
    MutableClockSource,
    Offset,
    ShowHandler,
    SMPTE,
    BaseClockSettings,
    ClockIdentifier
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { ClockBehaviour, OffsetSettings, ClockSettingsBase } from "./ClockData";

// prettier-ignore
export class TODOffsetClockSource implements MutableClockSource<OffsetSettings> {
    constructor(
        identifier:ClockIdentifier,
        settings: BaseClockSettings & OffsetSettings
    ) {
        this.identifier = identifier;
        this.settings = settings;
    }

    incorrectFramerate(): boolean {
        return false;
    }

    current(): SMPTE {
        const authClock = this.getHandler()?.getValue("clocks", this.authority().id);
        if (authClock && authClock.type === "tod") {
            if (
                this.settings.behaviour === ClockBehaviour.STOP &&
                this.state === ClockState.STOPPED
            )
                return new SMPTE("00:00:00:00");
            if (this.state === ClockState.RESET) {
                switch (this.duration().offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        return new SMPTE(this.duration()).setOffset(
                            Offset.START
                        );
                    case Offset.END:
                        return new SMPTE(this.duration()).setOffset(
                            Offset.END
                        );
                }
            }
            switch (this.duration().offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (
                            this.stopTime.lessThanOrEqual(authClock.duration(), true)
                        ) {
                            return authClock.duration()
                                .subtract(this.stopTime, true)
                                .add(this.duration(), true)
                                .setOffset(Offset.END);
                        }
                        return this.stopTime
                            .subtract(authClock.duration(), true)
                            .subtract(this.duration(), true)
                            .setOffset(Offset.START);
                    }
                    if (
                        getSyncClock()
                            .current()
                            .greaterThanOrEqual(authClock.duration(), true)
                    ) {
                        return authClock
                            .current()
                            .subtract(this.duration(), true)
                            .setOffset(Offset.START);
                    } else {
                        const c = authClock.current().add(this.duration());
                        c.setOffset(Offset.END);
                        return c;
                    }
                case Offset.END:
                    if (
                        this.state === ClockState.PAUSED ||
                        this.state === ClockState.STOPPED
                    ) {
                        if (
                            this.stopTime.lessThanOrEqual(authClock.duration(), true)
                        ) {
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
                        getSyncClock()
                            .current()
                            .greaterThanOrEqual(authClock.duration(), true)
                    ) {
                        return authClock
                            .current()
                            .add(this.duration(), true)
                            .setOffset(Offset.START);
                    } else {
                        const current = authClock.current();
                        if (
                            current.lessThanOrEqual(this.duration(), true)
                        ) {
                            return this.duration()
                                .subtract(current)
                                .setOffset(Offset.START);
                        } else {
                            return authClock
                                .current()
                                .subtract(this.duration())
                                .setOffset(Offset.END);
                        }
                    }
            }
        }
        return new SMPTE();
    }

    duration(): SMPTE {
        return this.settings.time;
    }

    start(): void {
        if (this.state === ClockState.STOPPED) this.reset(false);
        const authClock = this.getHandler()?.getValue("clocks", this.authority().id);
        if (authClock && authClock.type === "tod") {
            if (authClock.state === ClockState.RUNNING) {
                this.state = ClockState.RUNNING;
                EventHandler.emit(
                    "clock.start",
                    this.identifier
                );
                this.override = false;
            }
        }
    }

    setTime(time: SMPTE): void {

    }

    stop(override: boolean): void {
        if (this.state !== ClockState.STOPPED) {
            EventHandler.emit("clock.stop", this.identifier);
            this.state = ClockState.STOPPED;
            this.stopTime = getSyncClock().current();
            if (override) this.override = true;
        }
    }

    pause(override: boolean): void {
        if (this.state === ClockState.RUNNING) {
            EventHandler.emit("clock.pause", this.identifier);
            this.state = ClockState.PAUSED;
            this.stopTime = getSyncClock().current();
            if (override) this.override = true;
        }
    }

    reset(override: boolean): void {
        if (this.state !== ClockState.STOPPED) this.stop(override);
        EventHandler.emit("clock.reset", this.identifier);
        this.state = ClockState.RESET;
        this.overrun = false;
        this.complete = true;
        this.stopTime = new SMPTE();
        if (override) this.override = true;
    }

    update(): void {
        const authClock = this.getHandler()?.getValue("clocks", this.authority().id);
        if (authClock && authClock.type === "tod") {
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
                    break;
            }
            if (this.state === ClockState.RUNNING && !this.overrun) {
                const end =
                    this.duration().offset() === Offset.END
                        ? authClock.duration().subtract(this.duration(), true)
                        : authClock.duration().add(this.duration(), true);
                if (getSyncClock().current().greaterThanOrEqual(end)) {
                    this.complete = true;
                    EventHandler.emit(
                        "clock.complete",
                        this.identifier
                    );
                    if (this.settings.behaviour !== ClockBehaviour.OVERRUN)
                        this.stop(false);
                    else {
                        EventHandler.emit(
                            "clock.overrun",
                            this.identifier
                        );
                        this.overrun = true;
                    }
                }
            }
        }
    }

    setData(data: any): void {
        if (data?.displayName as string)
            this.settings.displayName = data.displayName;
        if (data?.time as string) this.settings.time = new SMPTE(data.time);
        if (data?.behaviour as string) this.settings.behaviour = data.behaviour;
    }

    private getHandler(): ShowHandler | undefined {
        return globalShowHandler();
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

    type: string = "offset:tod";
    identifier: ClockIdentifier;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    private lastParentState: ClockState = ClockState.RESET;
    private stopTime: SMPTE = new SMPTE();
    private override: boolean = false;
    private complete: boolean = false;
    private mauthority: ClockIdentifier | undefined;
    settings: BaseClockSettings & OffsetSettings;
}
