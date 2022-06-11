import {
    ClockStatus,
    getSyncClock,
    Offset,
    ShowHandler,
    SMPTE,
    BaseClockSettings,
    ClockIdentifier,
    ClockSource,
    ClockBehaviour,
    ControlBar
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { OffsetSettings } from "./ClockData";

export class TODOffsetClockSource implements ClockSource<OffsetSettings> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & OffsetSettings
    ) {
        this.identifier = identifier;
        this._settings = settings;
    }

    settings(): BaseClockSettings & OffsetSettings {
        return this._settings;
    }

    controlBar(): ControlBar[] {
        return [ControlBar.PLAY_PAUSE, ControlBar.STOP, ControlBar.RESET];
    }

    status(): ClockStatus {
        return this._status;
    }

    hasIncorrectFrameRate(): boolean {
        return false;
    }

    displayName(): string {
        return this._settings.displayName;
    }

    isOverrun(): boolean {
        return this._overrun;
    }

    current(): SMPTE {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        );
        if (authClock && authClock.type === "tod") {
            if (
                this._settings.behaviour === ClockBehaviour.STOP &&
                this.status() === ClockStatus.STOPPED
            )
                return new SMPTE("00:00:00:00");
            if (this.status() === ClockStatus.RESET) {
                switch (this.duration().offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        return new SMPTE(this.duration()).setOffset(
                            Offset.START
                        );
                    case Offset.END:
                        return new SMPTE(this.duration()).setOffset(Offset.END);
                }
            }
            switch (this.duration().offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (
                        this.status() === ClockStatus.PAUSED ||
                        this.status() === ClockStatus.STOPPED
                    ) {
                        if (
                            this._stopTime.lessThanOrEqual(
                                authClock.duration(),
                                true
                            )
                        ) {
                            return authClock
                                .duration()
                                .subtract(this._stopTime, true)
                                .add(this.duration(), true)
                                .setOffset(Offset.END);
                        }
                        return this._stopTime
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
                        this.status() === ClockStatus.PAUSED ||
                        this.status() === ClockStatus.STOPPED
                    ) {
                        if (
                            this._stopTime.lessThanOrEqual(
                                authClock.duration(),
                                true
                            )
                        ) {
                            return authClock
                                .duration()
                                .subtract(this._stopTime, true)
                                .subtract(this.duration(), true)
                                .setOffset(Offset.END);
                        }
                        return this._stopTime
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
                        if (current.lessThanOrEqual(this.duration(), true)) {
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
        return this._settings.time;
    }

    play(): void {
        if (this.status() === ClockStatus.STOPPED) this.reset(false);
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        );
        if (authClock && authClock.type === "tod") {
            if (authClock.state === ClockStatus.RUNNING) {
                this._status = ClockStatus.RUNNING;
                EventHandler.emit("clock.play", this.identifier);
                this._override = false;
            }
        }
    }

    setTime(): void {
        // NOOP
    }

    stop(override: boolean): void {
        if (this._status !== ClockStatus.STOPPED) {
            EventHandler.emit("clock.stop", this.identifier);
            this._status = ClockStatus.STOPPED;
            this._stopTime = getSyncClock().current();
            if (override) this._override = true;
        }
    }

    pause(override: boolean): void {
        if (this.status() === ClockStatus.RUNNING) {
            EventHandler.emit("clock.pause", this.identifier);
            this._status = ClockStatus.PAUSED;
            this._stopTime = getSyncClock().current();
            if (override) this._override = true;
        }
    }

    reset(override: boolean): void {
        if (this._status !== ClockStatus.STOPPED) this.stop(override);
        EventHandler.emit("clock.reset", this.identifier);
        this._status = ClockStatus.RESET;
        this._overrun = false;
        this._complete = true;
        this._stopTime = new SMPTE();
        if (override) this._override = true;
    }

    update(): void {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        );
        if (authClock && authClock.type === "tod") {
            if (this._lastParentState !== authClock.state)
                this._lastParentState = authClock.state;
            switch (this._lastParentState) {
                case ClockStatus.RESET:
                    if (this._status !== ClockStatus.RESET && !this._override)
                        this.reset(false);
                    break;
                case ClockStatus.STOPPED:
                    if (this._status !== ClockStatus.STOPPED && !this._override)
                        this.stop(false);
                    break;
                case ClockStatus.PAUSED:
                    if (this._status !== ClockStatus.PAUSED && !this._override)
                        this.pause(false);
                    break;
                case ClockStatus.RUNNING:
                    if (
                        this._status !== ClockStatus.RUNNING &&
                        !this._complete &&
                        !this._override
                    )
                        this.play();
                    break;
            }
            if (this.status() === ClockStatus.RUNNING && !this._overrun) {
                const end =
                    this.duration().offset() === Offset.END
                        ? authClock.duration().subtract(this.duration(), true)
                        : authClock.duration().add(this.duration(), true);
                if (getSyncClock().current().greaterThanOrEqual(end)) {
                    this._complete = true;
                    EventHandler.emit("clock.complete", this.identifier);
                    if (this.settings().behaviour !== ClockBehaviour.OVERRUN)
                        this.stop(false);
                    else {
                        EventHandler.emit("clock.overrun", this.identifier);
                        this._overrun = true;
                    }
                }
            }
        }
    }

    updateSettings(settings: any): BaseClockSettings & OffsetSettings {
        if (settings?.displayName as string)
            this._settings.displayName = settings.displayName;
        if (settings?.time as string) this._settings.time = new SMPTE(settings.time);
        if (settings?.behaviour as string)
            this._settings.behaviour = settings.behaviour;
        return this._settings;
    }

    data(): object {
        return {};
    }

    private getHandler(): ShowHandler | undefined {
        return globalShowHandler();
    }

    private authority(): ClockIdentifier {
        if (
            this._authority !== undefined &&
            `${this._authority.show}:${this._authority.session}:${this._authority.id}` ===
                this._settings.authority
        )
            return this._authority;
        else {
            const split = this._settings.authority.split(":");
            this._authority = {
                show: split[0],
                session: split[1],
                id: split[2],
                owner: ""
            };
            return this._authority;
        }
    }

    type: string = "offset:tod";
    identifier: ClockIdentifier;
    private _status: ClockStatus = ClockStatus.RESET;
    private _overrun: boolean = false;
    private _lastParentState: ClockStatus = ClockStatus.RESET;
    private _stopTime: SMPTE = new SMPTE();
    private _override: boolean = false;
    private _complete: boolean = false;
    private _authority: ClockIdentifier | undefined;
    private _settings: BaseClockSettings & OffsetSettings;
}
