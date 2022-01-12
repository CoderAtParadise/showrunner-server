import {
    ShowHandler,
    ClockSource,
    Storage,
    ClockIdentifier
} from "@coderatparadise/showrunner-common";
import { IProperty } from "@coderatparadise/showrunner-common/src/IProperty";
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
            if (value.active) value.clock.update();
        });
    }

    registerClock(clock: ClockSource) {
        this.showClocks.set(clock.id, {
            clock: clock,
            active: true,
            render: []
        });
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
        EventHandler.on("clock", () => globalShowHandler().tickClocks());
    }
};

export const globalShowHandler = (): GlobalShowHandler => {
    return mGlobalShowHandler;
};

let mGlobalShowHandler: GlobalShowHandler;

export default { initGlobalShowHandler, globalShowHandler };
