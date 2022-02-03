import {
    ShowHandler,
    ClockSource,
    Storage,
    ClockIdentifier,
    ClockState,
    ClockOptions,
    getSyncClock,
    IProperty,
    History
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";

class GlobalShowHandler implements ShowHandler {
    listClocks(): ClockIdentifier[] {
        return Array.from(this.showClocks.values());
    }

    getClock(id: string): ClockSource | undefined {
        return this.showClocks.get(id)?.clock;
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
            clock.clock.stop(false);
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
            configurable:
                options?.configurable !== undefined
                    ? options?.configurable
                    : true,
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

    history(): History[] {
        return [];
    }

    writeHistory(): boolean {
        return false;
    }

    undoHistory(): boolean {
        return false;
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
        mGlobalShowHandler.registerClock(getSyncClock(), {
            configurable: false
        });
        EventHandler.on("clock", () => globalShowHandler().tickClocks());
    }
};

export const globalShowHandler = (): GlobalShowHandler => {
    return mGlobalShowHandler;
};

let mGlobalShowHandler: GlobalShowHandler;

export default { initGlobalShowHandler, globalShowHandler };
