import {
    ShowHandler,
    ClockSource,
    getSyncClock
} from "@coderatparadise/showrunner-common";
import Debug from "debug";
import { EventHandler } from "./components/Scheduler";

export interface ClockIdentifier {
    clock: ClockSource;
    active: boolean;
}

class GlobalShowHandler implements ShowHandler {
    getClock(id: string): ClockSource | undefined {
        const clock = this.showClocks.get(id);
        if (clock?.active) return clock?.clock;
    }

    enableClock(id: string): boolean {
        const clock = this.showClocks.get(id);
        if (clock) {
            clock.active = true;
            return true;
        }

        return false;
    }

    disableClock(id: string): boolean {
        const clock = this.showClocks.get(id);
        if (clock) {
            clock.active = false;
            return true;
        }

        return false;
    }

    isRegisteredClock(id: string): boolean {
        return this.showClocks.has(id);
    }

    tickClocks(): void {
        Debug("showrunner:tick")(getSyncClock().current().toString());
        this.showClocks.forEach((value: ClockIdentifier) => {
            if (value.active) value.clock.update();
        });
    }

    registerClock(clock: ClockSource) {
        this.showClocks.set(clock.id, { clock: clock, active: true });
    }

    id: string = "globalShow";
    private showClocks: Map<string, ClockIdentifier> = new Map<
        string,
        ClockIdentifier
    >();
}

export const initGlobalShowHandler = (): void => {
    if (mGlobalShowHandler === undefined) {
        mGlobalShowHandler = new GlobalShowHandler();
        EventHandler.on("clock", () => globalShowHandler().tickClocks());
    }
};

export const globalShowHandler = (): GlobalShowHandler => {
    return mGlobalShowHandler;
};

let mGlobalShowHandler: GlobalShowHandler;

export default { initGlobalShowHandler, globalShowHandler };
