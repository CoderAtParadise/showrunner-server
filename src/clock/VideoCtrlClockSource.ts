import {
    CueUpWithData,
    InPreset,
    Play,
    Stop
} from "@coderatparadise/amp-grassvalley";
import {
    BaseClockSettings,
    ClockDirection,
    ClockIdentifier,
    ClockSource,
    ClockStatus,
    ControlBar,
    SMPTE
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { VideoData } from "../show/AmpChannelSource";
import { externalSourceManager } from "../show/ExternalSourceManager";

interface VideoCtrlSettings {
    channel: string;
    source: string;
    direction: ClockDirection;
}

export class VideoCtrlClockSource implements ClockSource<VideoCtrlSettings> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & VideoCtrlSettings
    ) {
        this.identifier = identifier;
        this._settings = settings;
        this._settings.blackList = ["displayName"];
    }

    settings(): BaseClockSettings & VideoCtrlSettings {
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
        return this._status;
    }

    displayName(): string {
        const channel = externalSourceManager.getSource(
            this._settings.channel
        )?.name;
        if (channel) {
            return this._settings.source !== ""
                ? channel + " - " + this._settings.source
                : channel + " - " + this._settings.displayName;
        }
        return this._settings.displayName;
    }

    hasIncorrectFrameRate(): boolean {
        const data: VideoData = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("video", this._settings.source) as VideoData;
        if (data) return data.incorrectframeRate;
        return false;
    }

    isOverrun(): boolean {
        return this._overrun;
    }

    current(): SMPTE {
        const current = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("current");
        if (
            current?.id !== this._settings.source ||
            this.status() === ClockStatus.RESET
        )
            return this.duration();
        switch (this._settings.direction) {
            case ClockDirection.COUNTUP:
                return current.time;
            case ClockDirection.COUNTDOWN:
                return this.duration().subtract(current.lastTime, true);
        }
    }

    duration(): SMPTE {
        const data: VideoData = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("video", this._settings.source) as VideoData;
        if (data !== undefined) return data.duration;
        else return new SMPTE();
    }

    play(): void {
        if (this._status !== ClockStatus.RUNNING) {
            if (this.status() === ClockStatus.STOPPED) {
                externalSourceManager
                    .getSource(this._settings.channel)
                    ?.get()
                    ?.sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: this._settings.source }
                    })
                    .then(() => {
                        externalSourceManager
                            .getSource(this._settings.channel)
                            ?.get()!
                            .sendCommand(Play, { byteCount: "0" });
                    });
            } else {
                externalSourceManager
                    .getSource(this._settings.channel)
                    ?.get()
                    ?.sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: this._settings.source }
                    })
                    .then(() => {
                        externalSourceManager
                            .getSource(this._settings.channel)
                            ?.get()!
                            .sendCommand(Play, { byteCount: "0" });
                    });
            }
            this._status = ClockStatus.RUNNING;
            EventHandler.emit("clock.play", this.identifier);
        }
    }

    setTime(time: SMPTE): void {
        if (this.status() === ClockStatus.RUNNING) {
            externalSourceManager
                .getSource(this._settings.channel)
                ?.get()
                .sendCommand(CueUpWithData, {
                    byteCount: "4",
                    data: { timecode: time.toString() }
                });
        }
    }

    pause(): void {
        if (this.status() === ClockStatus.RUNNING) {
            externalSourceManager
                .getSource(this._settings.channel)
                ?.get()!
                .sendCommand(Stop, { byteCount: "0" }); // PVS pauses on stop and will resume where left off
            this._status = this.lastRequest = ClockStatus.PAUSED;
            EventHandler.emit("clock.pause", this.identifier);
        }
    }

    stop(): void {
        if (
            this.status() === ClockStatus.RUNNING ||
            this.status() === ClockStatus.PAUSED
        ) {
            externalSourceManager
                .getSource(this._settings.channel)
                ?.get()!
                .sendCommand(Stop, { byteCount: "0" });
            this._status = this.lastRequest = ClockStatus.STOPPED;
            EventHandler.emit("clock.stop", this.identifier);
        }
    }

    reset(): void {
        externalSourceManager
            .getSource(this._settings.channel)
            ?.get()!
            .sendCommand(Stop, { byteCount: "0" })
            .then(() => {
                externalSourceManager
                    .getSource(this._settings.channel)
                    ?.get()!
                    .sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: "Reset" }
                    })
                    .then(() => {
                        externalSourceManager
                            .getSource(this._settings.channel)
                            ?.get()
                            ?.sendCommand(InPreset, {
                                byteCount: "A",
                                data: { clipName: this._settings.source }
                            });
                    });
            });
        this._status = this.lastRequest = ClockStatus.RESET;
        EventHandler.emit("clock.reset", this.identifier);
    }

    getBit(byte: number, bit: number): boolean {
        return (byte >> bit) % 2 === 0;
    }

    update(): void {
        const videoData = externalSourceManager
            .getSource(this._settings.channel)
            ?.data("video", this._settings.source) as VideoData;
        if (videoData !== undefined) {
            if (
                this.lastRequest !== undefined &&
                this.lastRequest !== videoData.running
            ) {
                this._status = videoData.running = this.lastRequest;
                this.lastRequest = undefined;
            }
            if (videoData.running === ClockStatus.RUNNING)
                this._status = ClockStatus.RUNNING;
            else if (this.status() === ClockStatus.RUNNING)
                this._status = ClockStatus.PAUSED;
        }
    }

    data(): object {
        return {};
    }

    updateSettings(settings: any): BaseClockSettings & VideoCtrlSettings {
        if (settings.displayName)
            this._settings.displayName = settings.displayName;
        if (settings.channel) this._settings.channel = settings.channel;
        if (settings.direction) this._settings.direction = settings.direction;
        return this._settings;
    }

    // prettier-ignore
    private lastRequest: ClockStatus | undefined;
    identifier: ClockIdentifier;
    type: string = "videoctrl";
    private _settings: BaseClockSettings & VideoCtrlSettings;
    private _status: ClockStatus = ClockStatus.RESET;
    private _overrun: boolean = false;
}
