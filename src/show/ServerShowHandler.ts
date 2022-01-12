import { ClockSource, ShowHandler, Storage } from "@coderatparadise/showrunner-common";
import { IProperty } from "@coderatparadise/showrunner-common/src/IProperty";
import { ClockIdentifier, globalShowHandler } from "./GlobalShowHandler";

export class ServerShowHandler implements ShowHandler {
    constructor(id: string, sessionId: string) {
        this.id = id;
        this.sessionId = sessionId;
    }
    getStorage: (id: string) => Storage<any> | undefined;
    hasOverrideProperty: (id: string, key: string) => boolean;
    getOverrideProperty: (id: string, key: string) => IProperty<any> | undefined;
    setOverrideProperty: (property: IProperty<any>) => void;
    removeOverrideProperty: (id: string, key: string) => void;

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
