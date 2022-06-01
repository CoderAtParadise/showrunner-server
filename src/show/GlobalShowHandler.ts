import { ListFirstID, ListNextID } from "@coderatparadise/amp-grassvalley";
import {
    ShowHandler,
    ClockSource,
    getSyncClock,
    History,
    ClockDirection
} from "@coderatparadise/showrunner-common";
import { AmpCtrlClock } from "../clock/AmpCtrlClockSource";
import { VideoCtrlClockSource } from "../clock/VideoCtrlClockSource";
import { EventHandler } from "../Scheduler";
import { loadClocks, saveClocks } from "../util/FileHandler";
import { externalSourceManager } from "./ExternalSourceManager";

class GlobalShowHandler implements ShowHandler {
    tick(): void {
        this.clocks.forEach((value: ClockSource<any>) => value.update());
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

    isDirty(): boolean {
        return this.dirty;
    }

    markDirty(dirty: boolean): void {
        this.dirty = dirty;
    }

    get(key: string): any[] {
        switch (key) {
            case "clocks":
                return Array.from(this.clocks.values());
        }
        return [];
    }

    getValue(key: string, id: string): any {
        switch (key) {
            case "clocks":
                return this.clocks.get(id);
        }
        return undefined;
    }

    setValue(key: string, value: any): void {
        switch (key) {
            case "clocks":
                // eslint-disable-next-line no-case-declarations
                const clock = value as ClockSource<any>;
                this.clocks.set(clock.identifier.id, clock);
                break;
        }
    }

    id: string = "system";
    displayName: string = "System";
    location: string = "system";
    private dirty: boolean = false;
    private clocks: Map<string, ClockSource<any>> = new Map<
        string,
        ClockSource<any>
    >();
}

export const initGlobalShowHandler = (): void => {
    if (mGlobalShowHandler === undefined) {
        mGlobalShowHandler = new GlobalShowHandler();
        mGlobalShowHandler.setValue("clocks", getSyncClock());
        EventHandler.on("clock", () => globalShowHandler().tick());
        loadClocks();
        setInterval(() => {
            if (mGlobalShowHandler.isDirty()) {
                saveClocks();
                mGlobalShowHandler.markDirty(false);
            }
        }, 5000);
    }
};

export const globalShowHandler = (): GlobalShowHandler => {
    initGlobalShowHandler();
    return mGlobalShowHandler;
};

let mGlobalShowHandler: GlobalShowHandler;

export default { initGlobalShowHandler, globalShowHandler };
