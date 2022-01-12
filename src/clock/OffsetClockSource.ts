import {
    MutableClockSource,
    SMPTE,
    ClockState,
    ShowHandler,
    Offset,
    ClockSource
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { OffsetSettings, TimerSettings } from "./ClockData";

export class OffsetClockSource implements MutableClockSource {
    constructor(
        owner: string,
        show: string,
        id: string,
        display: string,
        settings: OffsetSettings
    ) {
        this.owner = owner;
        this.show = show;
        this.id = id;
        this.display = display;
        this.settings = settings;
    }

    current(): SMPTE {
        const authClock = this.getHandler()?.getClock(this.settings.authority);
        if (authClock) {
            const end = this.getAuthSettingsEnd(authClock);
            if (end) {
                const current = authClock.current();
                switch (this.settings.offset.offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        if (current.greaterThanOrEqual(this.settings.offset)) {
                            const c = authClock
                                .current()
                                .subtract(this.settings.offset);
                            c.setOffset(Offset.START);
                            return c;
                        } else {
                            const c = this.settings.offset.subtract(
                                authClock.current()
                            );
                            c.setOffset(Offset.END);
                            return c;
                        }
                    case Offset.END:
                        if (
                            current.greaterThanOrEqual(
                                end.subtract(this.settings.offset)
                            )
                        ) {
                            const c = authClock
                                .current()
                                .subtract(this.settings.offset);
                            c.setOffset(Offset.START);
                            return c;
                        } else {
                            const c = end
                                .subtract(this.settings.offset)
                                .subtract(authClock.current());
                            c.setOffset(Offset.END);
                            return c;
                        }
                }
            }
        }
        return new SMPTE();
    }

    start(): void {
        if (
            this.state === ClockState.STOPPED ||
            this.state === ClockState.HIDDEN
        )
            this.reset();
        const authClock = this.getHandler()?.getClock(this.settings.authority);
        if (authClock) {
            if (
                authClock.state === ClockState.RUNNING ||
                authClock.state === ClockState.OVERRUN
            ) {
                this.state = ClockState.RUNNING;
                EventHandler.emit(
                    "clock.start",
                    this.owner,
                    this.show,
                    this.id
                );
            }
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
            this.state = ClockState.PAUSED;
            EventHandler.emit("clock.pause", this.owner, this.show, this.id);
        }
    }

    reset(): void {
        EventHandler.emit("clock.reset", this.owner, this.show, this.id);
        this.state = ClockState.STOPPED;
    }

    update(): void {
        if (this.state === ClockState.RUNNING) {
            const authClock = this.getHandler()?.getClock(
                this.settings.authority
            );
            if (authClock) {
                const aend = this.getAuthSettingsEnd(authClock);
                if (aend) {
                    const end = aend.subtract(this.settings.offset);
                    switch (this.settings.offset.offset()) {
                        case Offset.NONE:
                        case Offset.START:
                            if (
                                authClock
                                    .current()
                                    .greaterThanOrEqual(this.settings.offset)
                            ) {
                                EventHandler.emit(
                                    "clock.complete",
                                    this.owner,
                                    this.show,
                                    this.id
                                );
                                this.stop();
                            }
                            break;
                        case Offset.END:
                            if (authClock.current().greaterThanOrEqual(end)) {
                                EventHandler.emit(
                                    "clock.complete",
                                    this.owner,
                                    this.show,
                                    this.id
                                );
                                this.stop();
                            }

                            break;
                    }
                }
            }
        }
    }

    data(): object | undefined {
        return {
            show: this.show,
            settings: this.settings
        };
    }

    public setData(data: any) {
        if (data as OffsetSettings) this.settings = data;
        if (data?.settings as OffsetSettings) this.settings = data.settings;
    }

    private getAuthSettingsEnd(auth: ClockSource): SMPTE | undefined {
        switch (auth.type) {
            case "timer":
                return ((auth.data() as any)?.settings as TimerSettings)
                    .duration;
            default:
                return undefined;
        }
    }

    private getHandler(): ShowHandler | undefined {
        return globalShowHandler(); // TODO undate to actually get show
    }

    type: string = "offset";
    owner: string;
    show: string;
    id: string;
    display: string;
    state: ClockState = ClockState.STOPPED;
    private settings: OffsetSettings;
}
