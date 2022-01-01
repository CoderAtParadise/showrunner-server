import {
    MutableClockSource,
    SMPTE,

    ClockState,
    ShowHandler,
    TimerSettings,
    Offset
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "./Scheduler";

export class OffsetClockSource implements MutableClockSource {
    constructor(
        id: string,
        display: string,
        showHandler: ShowHandler,
        authority: string,
        offset: SMPTE
    ) {
        this.id = id;
        this.display = display;
        this.showHandler = showHandler;
        this.authority = authority;
        this.offset = offset;
    }

    current(): SMPTE {
        const authClock = this.showHandler.getClock(this.authority);
        if (authClock) {
            const settings = (authClock.data() as any)
                ?.settings as TimerSettings;
            const current = authClock.current();
            switch (this.offset.offset()) {
                case Offset.NONE:
                case Offset.START:
                    if (current.greaterThanOrEqual(this.offset)) {
                        const c = authClock.current().subtract(this.offset);
                        c.setOffset(Offset.START);
                        return c;
                    } else {
                        const c = this.offset.subtract(authClock.current());
                        c.setOffset(Offset.END);
                        return c;
                    }
                case Offset.END:
                    if (
                        current.greaterThanOrEqual(
                            settings.duration.subtract(this.offset)
                        )
                    ) {
                        const c = authClock.current().subtract(this.offset);
                        c.setOffset(Offset.START);
                        return c;
                    } else {
                        const c = settings.duration
                            .subtract(this.offset)
                            .subtract(authClock.current());
                        c.setOffset(Offset.END);
                        return c;
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
        const authClock = this.showHandler.getClock(this.authority);
        if (authClock) {
            if (
                authClock.state === ClockState.RUNNING ||
                authClock.state === ClockState.OVERRUN
            ) {
                this.state = ClockState.RUNNING;
                EventHandler.emit("timer.start", this.id);
            }
        }
    }

    stop(): void {
        EventHandler.emit("timer.stop", this.id);
        this.state = ClockState.STOPPED;
    }

    pause(): void {
        EventHandler.emit("timer.pause", this.id);
        if (
            this.state === ClockState.RUNNING ||
            this.state === ClockState.PAUSED
        )
            this.state = ClockState.PAUSED;
    }

    reset(): void {
        EventHandler.emit("timer.reset", this.id);
        this.state = ClockState.STOPPED;
    }

    update(): void {
        if (this.state === ClockState.RUNNING) {
            const authClock = this.showHandler.getClock(this.authority);
            if (authClock) {
                const settings = (authClock.data() as any)
                    ?.settings as TimerSettings;
                const end = settings.duration.subtract(this.offset);
                switch (this.offset.offset()) {
                    case Offset.NONE:
                    case Offset.START:
                        if (authClock.current().greaterThanOrEqual(this.offset)) {
                            EventHandler.emit("timer.complete", this.id);
                            this.state = ClockState.STOPPED;
                        }
                        break;
                    case Offset.END:
                        if (authClock.current().greaterThanOrEqual(end)) {
                            EventHandler.emit("timer.complete", this.id);
                            this.state = ClockState.STOPPED;
                        }

                        break;
                }
            }
        }
    }

    data(): object | undefined {
        return {
            show: this.showHandler.id,
            authority: this.authority,
            offset: this.offset
        };
    }

    setData(data: any) {
        if (data as string) this.authority = data;
        if (data?.authority as string) this.authority = data.authority;
        if (data as SMPTE) this.offset = data;
        if (data?.offset as SMPTE) this.offset = data.offset;
    }

    id: string;
    display: string;
    state: ClockState = ClockState.STOPPED;
    private showHandler: ShowHandler;
    private authority: string;
    private offset: SMPTE;
}
