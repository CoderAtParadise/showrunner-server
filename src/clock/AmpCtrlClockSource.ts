import {
    ClockState,
    SMPTE,
    ClockDirection,
    MutableClockSource,
    BaseClockSettings,
    ClockIdentifier,
    ClockSource
} from "@coderatparadise/showrunner-common";
import { externalSourceManager } from "../show/ExternalSourceManager";
import { VideoData } from "../show/AmpChannelSource";
import { globalShowHandler } from "../show/GlobalShowHandler";

// prettier-ignore
export class AmpCtrlClock implements MutableClockSource<{ channel: string; direction: ClockDirection }> {
    // prettier-enable
    constructor(identifier: ClockIdentifier, settings: BaseClockSettings & {channel:string, direction:ClockDirection}) {
        this.identifier = identifier;
        this.settings = settings;
    }

    displayName(): string {
        const channel = externalSourceManager.getSource(
            this.settings.channel
        )?.name;
        if (channel) {
            return this.syncData.currentID !== ""
                ? `${channel}-${this.syncData.currentID} \u0028${this.settings.displayName}\u0029`
                : channel + " - " + this.settings.displayName;
        }
        return this.settings.displayName;
    }

    incorrectFramerate(): boolean {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data !== undefined) return data.incorrectFramerate;
        }
        return false;
    }

    current(): SMPTE {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue("clocks", data.id) as ClockSource<any>;
                return clock.current();
            }
        }
        return new SMPTE();
    }

    duration(): SMPTE {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");

        if (currentId !== undefined) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data !== undefined) return data.duration;
        }
        return new SMPTE();
    }

    start(): void {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue("clocks", data.id) as ClockSource<any>;
                clock.start();
            }
        }
    }

    setTime(time: SMPTE): void {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue("clocks", data.id) as ClockSource<any>;
                clock.setTime(time);
            }
        }
    };

    pause(): void {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue("clocks", data.id) as ClockSource<any>;
                clock.pause(false);
            }
        }
    }

    stop(): void {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue("clocks", data.id) as ClockSource<any>;
                clock.stop(false);
            }
        }
    }

    reset(): void {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue("clocks", data.id) as ClockSource<any>;
                clock.reset(false);
            }
        }
    }

    update(): void {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this.settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue("clocks", data.id) as ClockSource<any>;
                this.state = clock.state;
            } else this.state = ClockState.RESET;
        } else this.state = ClockState.RESET;
    }

    data(): object {
        return { currentId: this.syncData.currentID };
    }

    setData(data: any): void {
        if (data.displayName) this.settings.displayName = data.displayName;
        if (data.channel) this.settings.channel = data.channel;
        if (data.direction) this.settings.direction = data.direction;
    }

    identifier: ClockIdentifier;
    type: string = "ampctrl";
    // prettier-ignore
    settings: BaseClockSettings & {
        channel: string;
        direction: ClockDirection;
    };

    overrun: boolean = false;
    automation: boolean = false;
    state: ClockState = ClockState.RESET;
    // prettier-ignore
    private syncData: {
        currentID: string;
    } = {
            currentID: ""
        };
}
