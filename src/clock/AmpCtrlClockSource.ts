import {
    ClockStatus,
    SMPTE,
    ClockDirection,
    ClockSource,
    BaseClockSettings,
    ClockIdentifier,
    ControlBar
} from "@coderatparadise/showrunner-common";
import { externalSourceManager } from "../show/ExternalSourceManager";
import { VideoData } from "../show/AmpChannelSource";
import { globalShowHandler } from "../show/GlobalShowHandler";

interface AmpSettings {
    channel: string;
    direction: ClockDirection;
}

export class AmpCtrlClock implements ClockSource<AmpSettings> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & AmpSettings
    ) {
        this.identifier = identifier;
        this._settings = settings;
        this._settings.blackList = ["displayName"];
    }

    settings(): BaseClockSettings & AmpSettings {
        return this._settings;
    }

    controlBar(): ControlBar[] {
        return [
            ControlBar.PLAY_PAUSE,
            ControlBar.STOP,
            ControlBar.RESET,
            ControlBar.POSITION
        ];
    }

    status(): ClockStatus {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data !== undefined) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                return clock.status();
            }
        }
        return ClockStatus.RESET;
    }

    displayName(): string {
        const channel = externalSourceManager.getSource(
            this._settings.channel
        )?.name;
        if (channel !== undefined) {
            return this.syncData.currentID !== ""
                ? `${channel}-${this.syncData.currentID} \u0028${this._settings.displayName}\u0029`
                : channel + " - " + this._settings.displayName;
        }
        return this._settings.displayName;
    }

    hasIncorrectFrameRate(): boolean {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data !== undefined) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                return clock.hasIncorrectFrameRate();
            }
        }
        return false;
    }

    isOverrun(): boolean {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data !== undefined) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                return clock.isOverrun();
            }
        }
        return false;
    }

    current(): SMPTE {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data !== undefined) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                return clock.current();
            }
        }
        return new SMPTE();
    }

    duration(): SMPTE {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");

        if (currentId !== undefined) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data !== undefined) return data.duration;
        }
        return new SMPTE();
    }

    play(): void {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                clock.play();
            }
        }
    }

    setTime(time: SMPTE): void {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                clock.setTime(time);
            }
        }
    }

    pause(): void {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                clock.pause(false);
            }
        }
    }

    stop(): void {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                clock.stop(false);
            }
        }
    }

    reset(): void {
        const currentId = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current", "id");
        if (currentId) {
            const data: VideoData = externalSourceManager
                .getSource(this._settings.channel)
                ?.data("video", currentId) as VideoData;
            if (data) {
                const clock = globalShowHandler().getValue(
                    "clocks",
                    data.id
                ) as ClockSource<any>;
                clock.reset(false);
            }
        }
    }

    update(): void {}

    data(): object {
        return { currentId: this.syncData.currentID };
    }

    updateSettings(settings: any): BaseClockSettings & AmpSettings {
        if (settings.displayName) this._settings.displayName = settings.displayName;
        if (settings.channel) this._settings.channel = settings.channel;
        if (settings.direction) this._settings.direction = settings.direction;
        return this._settings;
    }

    identifier: ClockIdentifier;
    type: string = "ampctrl";
    private _settings: BaseClockSettings & AmpSettings;
    // prettier-ignore
    private syncData: {
        currentID: string;
    } = {
            currentID: ""
        };
}
