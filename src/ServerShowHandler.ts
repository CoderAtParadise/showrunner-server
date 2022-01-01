import { ClockSource, ShowHandler } from "@coderatparadise/showrunner-common";
import { ClockIdentifier, globalShowHandler } from "./GlobalShowHandler";

export class ServerShowHandler implements ShowHandler {
    constructor(id: string, sessionId: string) {
        this.id = id;
        this.sessionId = sessionId;
    }

    getClock(id: string): ClockSource | undefined {
        const clock = this.showClocks.get(id);
        if (clock?.active) return clock?.clock;
        return globalShowHandler().getClock(id);
    }

    enableClock(id: string): boolean {
        const clock = this.showClocks.get(id);
        if (clock) {
            clock.active = true;
            return true;
        }

        return globalShowHandler().enableClock(id);
    }

    isRegisteredClock(id: string): boolean {
        return this.showClocks.has(id);
    }

    disableClock(id: string): boolean {
        const clock = this.showClocks.get(id);
        if (clock) {
            clock.active = false;
            return true;
        }

        return globalShowHandler().disableClock(id);
    }

    tickClocks(): void {
        this.showClocks.forEach((value: ClockIdentifier) => {
            if (value.active) value.clock.update();
        });
    }

    id: string;
    private sessionId: string;
    private showClocks: Map<string, ClockIdentifier> = new Map<
        string,
        ClockIdentifier
    >();
}
