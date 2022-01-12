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
import { OffsetSettings, ToTimeSettings } from "./ClockData";

export class ToTimeOffsetClockSource implements MutableClockSource {
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
        if (authClock && authClock.type === "toTime") {
            const settings = (authClock.data() as any)
                ?.settings as ToTimeSettings;
            switch (this.settings.offset.offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (
                        getSyncClock()
                            .current()
                            .greaterThanOrEqual(settings.time)
                    ) {
                        const of = new SMPTE("00:00:00:00").subtract(
                            authClock.current()
                        );
                        if (of.greaterThan(this.settings.offset)) {
                            const c = of.subtract(this.settings.offset);
                            c.setOffset(Offset.START);
                            return c;
                        } else {
                            const c = this.settings.offset.subtract(of);
                            c.setOffset(Offset.END);
                            return c;
                        }
                    } else {
                        const c = authClock.current().add(this.settings.offset);
                        c.setOffset(Offset.END);
                        return c;
                    }
                case Offset.END:
                    if (
                        getSyncClock()
                            .current()
                            .greaterThanOrEqual(settings.time)
                    ) {
                        const c = new SMPTE("00:00:00:00")
                            .subtract(authClock.current())
                            .add(this.settings.offset);
                        c.setOffset(Offset.START);
                        return c;
                    } else {
                        const current = authClock.current();
                        if (current.lessThan(this.settings.offset)) {
                            const c = this.settings.offset.subtract(current);
                            c.setOffset(Offset.START);
                            return c;
                        } else {
                            const c = authClock
                                .current()
                                .subtract(this.settings.offset);
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
        EventHandler.emit("clock.stop", this.owner, this.show, this.id);
        this.state = ClockState.STOPPED;
    }

    pause(): void {
        EventHandler.emit("clock.pause", this.owner, this.show, this.id);
        if (
            this.state === ClockState.RUNNING ||
            this.state === ClockState.PAUSED
        )
            this.state = ClockState.PAUSED;
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
                switch (this.settings.offset.offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        //         if (
                        //             authClock.current().greaterThanOrEqual(this.offset)
                        //         ) {
                        //             EventHandler.emit("clock.complete", this.id);
                        //             this.stop();
                        //         }
                        break;
                    case Offset.END:
                        //         if (authClock.current().greaterThanOrEqual(end)) {
                        //             EventHandler.emit("clock.complete", this.id);
                        //             this.stop();
                        //         }
                        break;
                }
            }
        }
    }

    data(): object | undefined {
        return { show: this.show, settings: this.settings };
    }

    setData(data: any): void {
        if (data as OffsetSettings) this.settings = data;
        if (data?.settings as OffsetSettings) this.settings = data.settings;
    }

    private getHandler(): ShowHandler | undefined {
        return globalShowHandler();
    }

    type: string = "toTime:offset";
    owner: string;
    show: string;
    id: string;
    display: string;
    state: ClockState = ClockState.STOPPED;
    private settings: OffsetSettings;
}
