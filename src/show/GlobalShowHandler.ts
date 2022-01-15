import {
    ShowHandler,
    ClockSource,
    Storage,
    ClockIdentifier,
    ClockState,
    getSyncClock
} from "@coderatparadise/showrunner-common";
import { IProperty } from "@coderatparadise/showrunner-common/src/IProperty";
import { ClockOptions } from "@coderatparadise/showrunner-common/src/ShowHandler";
import { EventHandler } from "../Scheduler";

class GlobalShowHandler implements ShowHandler {
    listClocks(): ClockIdentifier[] {
        return Array.from(this.showClocks.values());
    }

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
            clock.clock.stop();
            clock.active = false;
            return true;
        }

        return false;
    }

    isRegisteredClock(id: string): boolean {
        return this.showClocks.has(id);
    }

    tickClocks(): void {
        this.showClocks.forEach((value: ClockIdentifier) => {
            if (value.active || value.clock.state !== ClockState.STOPPED)
                value.clock.update();
        });
    }

    registerClock(clock: ClockSource, options?: ClockOptions): boolean {
        if (this.isRegisteredClock(clock.id)) return false;
        this.showClocks.set(clock.id, {
            clock: clock,
            active: options?.active || true,
            automation: options?.automation || false,
            renderChannel: options?.renderChannel || []
        });
        return true;
    }

    getStorage(): Storage<any> | undefined {
        return undefined;
    }

    hasOverrideProperty(): boolean {
        return false;
    }

    getOverrideProperty(): IProperty<any> | undefined {
        return undefined;
    }

    setOverrideProperty(): void {
        // NOOP
    }

    removeOverrideProperty(): void {
        // NOOP
    }

    id: string = "system";
    private showClocks: Map<string, ClockIdentifier> = new Map<
        string,
        ClockIdentifier
    >();
}

export const initGlobalShowHandler = (): void => {
    if (mGlobalShowHandler === undefined) {
        mGlobalShowHandler = new GlobalShowHandler();
        mGlobalShowHandler.registerClock(getSyncClock());
        EventHandler.on("clock", () => globalShowHandler().tickClocks());
    }
};

export const globalShowHandler = (): GlobalShowHandler => {
    return mGlobalShowHandler;
};

let mGlobalShowHandler: GlobalShowHandler;

export default { initGlobalShowHandler, globalShowHandler };
