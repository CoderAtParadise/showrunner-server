import {
    SMPTE,
    ClockStatus,
    ShowHandler,
    Offset,
    BaseClockSettings,
    ClockIdentifier,
    ClockSource,
    ClockBehaviour,
    ControlBar
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { OffsetSettings } from "./ClockData";

export class OffsetClockSource implements ClockSource<OffsetSettings> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & OffsetSettings
    ) {
        this.identifier = identifier;
        this._settings = settings;
    }

    status(): ClockStatus {
        return this._status;
    }

    settings(): BaseClockSettings & OffsetSettings {
        return this._settings;
    }

    controlBar(): ControlBar[] {
        return [ControlBar.PLAY_PAUSE, ControlBar.STOP, ControlBar.RESET];
    }

    displayName(): string {
        return this._settings.displayName;
    }

    hasIncorrectFrameRate(): boolean {
        return false;
    }

    isOverrun(): boolean {
        return this._overrun;
    }

    current(): SMPTE {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        ) as ClockSource<any>;
        if (authClock) {
            if (
                (authClock.status() !== ClockStatus.STOPPED &&
                    this.status() === ClockStatus.STOPPED) ||
                (authClock.current().greaterThan(this.duration(), true) &&
                    this.settings().behaviour === ClockBehaviour.STOP)
            )
                return new SMPTE("00:00:00:00");
            if (this.status() === ClockStatus.RESET) {
                switch (this.duration().offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        return new SMPTE(this.duration()).setOffset(Offset.END);
                    case Offset.END:
                        return authClock
                            .duration()
                            .subtract(this.duration(), true)
                            .setOffset(Offset.END);
                }
            }
            const difference = authClock
                .duration()
                .subtract(this.duration(), true);
            switch (this.duration().offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (
                        this.status() === ClockStatus.PAUSED ||
                        this.status() === ClockStatus.STOPPED
                    ) {
                        if (this.stopTime.lessThanOrEqual(difference, true)) {
                            return authClock
                                .duration()
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
                        this.status() === ClockStatus.PAUSED ||
                        this.status() === ClockStatus.STOPPED
                    ) {
                        if (this.stopTime.lessThanOrEqual(difference, true)) {
                            return authClock
                                .duration()
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
        return this._settings.time;
    }

    play(): void {
        if (this.status() === ClockStatus.STOPPED) this.reset(false);
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        );
        if (authClock) {
            if (authClock.status() === ClockStatus.RUNNING) {
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
            this.stopTime =
                this.getHandler()
                    ?.getValue("clocks", this.authority().id)
                    ?.current() || new SMPTE();
            if (override) this._override = true;
        }
    }

    pause(override: boolean): void {
        if (this.status() === ClockStatus.RUNNING) {
            this._status = ClockStatus.PAUSED;
            EventHandler.emit("clock.pause", this.identifier);
            this.stopTime =
                this.getHandler()
                    ?.getValue("clocks", this.authority().id)
                    ?.current() || new SMPTE();
            if (override) this._override = true;
        }
    }

    reset(override: boolean): void {
        if (this._status !== ClockStatus.STOPPED) this.stop(override);
        EventHandler.emit("clock.reset", this.identifier);
        this._overrun = false;
        this._status = ClockStatus.RESET;
        this._complete = false;
        if (override) this._override = true;
    }

    update(): void {
        const authClock = this.getHandler()?.getValue(
            "clocks",
            this.authority().id
        );
        if (authClock) {
            if (this._lastParent_status !== authClock.status())
                this._lastParent_status = authClock.status();
            switch (this._lastParent_status) {
                case ClockStatus.RESET:
                    if (this._status !== ClockStatus.RESET && !this._override)
                        this.reset(false);
                    break;
                case ClockStatus.STOPPED:
                    if (
                        this.status() !== ClockStatus.STOPPED &&
                        !this._override
                    )
                        this.stop(false);
                    break;
                case ClockStatus.PAUSED:
                    if (this.status() !== ClockStatus.PAUSED && !this._override)
                        this.pause(false);
                    break;
                case ClockStatus.RUNNING:
                    if (
                        this.status() !== ClockStatus.RUNNING &&
                        !this._complete &&
                        !this._override
                    )
                        this.play();
            }
            if (this.status() === ClockStatus.RUNNING && !this._overrun) {
                const end =
                    this.duration().offset() === Offset.END
                        ? authClock.duration().subtract(this.duration(), true)
                        : this.duration();
                if (authClock.current().greaterThanOrEqual(end)) {
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
        return globalShowHandler(); // TODO undate to actually get show
    }

    private authority(): ClockIdentifier {
        if (
            this._authority !== undefined &&
            `${this._authority.show}:${this._authority.session}:${this._authority.id}` ===
                this.settings().authority
        )
            return this._authority;
        else {
            const split = this.settings().authority.split(":");
            this._authority = {
                show: split[0],
                session: split[1],
                id: split[2],
                owner: ""
            };
            return this._authority;
        }
    }

    type: string = "offset";
    identifier: ClockIdentifier;
    private _status: ClockStatus = ClockStatus.RESET;
    private _overrun: boolean = false;
    private stopTime: SMPTE = new SMPTE();
    private _lastParent_status: ClockStatus = ClockStatus.RESET;
    private _complete: boolean = false;
    private _override: boolean = false;
    private _authority: ClockIdentifier | undefined;
    private _settings: BaseClockSettings & OffsetSettings;
}
