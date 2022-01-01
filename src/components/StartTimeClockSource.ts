import {
    MutableClockSource,
    SMPTE,
    getSyncClock,
    ClockState
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "./Scheduler";

export class StartTimeClockSource implements MutableClockSource {
    constructor(id: string, display: string, startTime: SMPTE) {
        this.id = id;
        this.display = display;
        this.startTime = startTime;
    }

    current(): SMPTE {
        return getSyncClock().current().subtract(this.startTime);
    }

    start(): void {
        // NOOP
    }

    stop(): void {
        // NOOP
    }

    pause(): void {
        // NOOP
    }

    reset(): void {
        // NOOP
    }

    update(): void {
        if (getSyncClock().current().equals(this.startTime))
            EventHandler.emit("timer.complete", this.id);
    }

    data(): object | undefined {
        return { startTime: this.startTime };
    }

    setData(data: any): void {
        if (data instanceof SMPTE) this.startTime = data;
        if (data?.startTime as SMPTE) this.startTime = data.startTime;
    }

    id: string;
    display: string;
    state: ClockState = ClockState.STOPPED;
    private startTime: SMPTE;
}
