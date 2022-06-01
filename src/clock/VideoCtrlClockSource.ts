import { InPreset, Play, Stop } from "@coderatparadise/amp-grassvalley";
import {
    BaseClockSettings,
    ClockDirection,
    ClockIdentifier,
    ClockState,
    MutableClockSource,
    SMPTE
} from "@coderatparadise/showrunner-common";
import { EventHandler } from "../Scheduler";
import { VideoData } from "../show/AmpChannelSource";
import { externalSourceManager } from "../show/ExternalSourceManager";

interface VideoCtrlData {
    channel: string;
    source: string;
    direction: ClockDirection;
}

export class VideoCtrlClockSource implements MutableClockSource<VideoCtrlData> {
    constructor(
        identifier: ClockIdentifier,
        settings: BaseClockSettings & VideoCtrlData
    ) {
        this.identifier = identifier;
        this.settings = settings;
    }

    displayName(): string {
        return this.settings.source !== ""
            ? this.settings.channel + " - " + this.settings.source
            : this.settings.channel + " - " + this.settings.displayName;
    }

    incorrectFramerate(): boolean {
        const data: VideoData = externalSourceManager
            .getSource(this.settings.channel)
            ?.data("video", this.settings.source) as VideoData;
        if (data) return data.incorrectFramerate;
        return false;
    }

    current(): SMPTE {
        const current = externalSourceManager
            .getSource(this.settings.channel)
            ?.data("current");
        if (
            current?.id !== this.settings.source ||
            this.state === ClockState.RESET
        )
            return this.duration();
        switch (this.settings.direction) {
            case ClockDirection.COUNTUP:
                return current.time;
            case ClockDirection.COUNTDOWN:
                return this.duration().subtract(current.lastTime, true);
        }
    }

    duration(): SMPTE {
        const data: VideoData = externalSourceManager
            .getSource(this.settings.channel)
            ?.data("video", this.settings.source) as VideoData;
        if (data !== undefined) return data.duration;
        else return new SMPTE();
    }

    start(): void {
        if (this.state !== ClockState.RUNNING) {
            if (this.state === ClockState.STOPPED) {
                externalSourceManager
                    .getSource(this.settings.channel)
                    ?.get()
                    ?.sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: this.settings.source }
                    })
                    .then(() => {
                        externalSourceManager
                            .getSource(this.settings.channel)
                            ?.get()!
                            .sendCommand(Play, { byteCount: "0" });
                    });
            } else {
                externalSourceManager
                    .getSource(this.settings.channel)
                    ?.get()
                    ?.sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: this.settings.source }
                    })
                    .then(() => {
                        externalSourceManager
                            .getSource(this.settings.channel)
                            ?.get()!
                            .sendCommand(Play, { byteCount: "0" });
                    });
            }
            this.state = ClockState.RUNNING;
            EventHandler.emit("clock.pause", this.identifier);
        }
    }

    setTime(time: SMPTE): void {}

    pause(): void {
        if (this.state === ClockState.RUNNING) {
            externalSourceManager
                .getSource(this.settings.channel)
                ?.get()!
                .sendCommand(Stop, { byteCount: "0" }); // PVS pauses on stop and will resume where left off
            this.state = this.lastRequest = ClockState.PAUSED;
            EventHandler.emit("clock.pause", this.identifier);
        }
    }

    stop(): void {
        if (
            this.state === ClockState.RUNNING ||
            this.state === ClockState.PAUSED
        ) {
            externalSourceManager
                .getSource(this.settings.channel)
                ?.get()!
                .sendCommand(Stop, { byteCount: "0" });
            this.state = this.lastRequest = ClockState.STOPPED;
            EventHandler.emit("clock.stop", this.identifier);
        }
    }

    reset(): void {
        externalSourceManager
            .getSource(this.settings.channel)
            ?.get()!
            .sendCommand(Stop, { byteCount: "0" })
            .then(() => {
                externalSourceManager
                    .getSource(this.settings.channel)
                    ?.get()!
                    .sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: "Reset" }
                    })
                    .then(() => {
                        externalSourceManager
                            .getSource(this.settings.channel)
                            ?.get()
                            ?.sendCommand(InPreset, {
                                byteCount: "A",
                                data: { clipName: this.settings.source }
                            });
                    });
            });
        this.state = this.lastRequest = ClockState.RESET;
        EventHandler.emit("clock.reset", this.identifier);
    }

    getBit(byte: number, bit: number): boolean {
        return (byte >> bit) % 2 === 0;
    }

    update(): void {
        const videoData = externalSourceManager
            .getSource(this.settings.channel)
            ?.data("video", this.settings.source) as VideoData;
        if (videoData !== undefined) {
            if (
                this.lastRequest !== undefined &&
                this.lastRequest !== videoData.running
            ) {
                this.state = videoData.running = this.lastRequest;
                this.lastRequest = undefined;
            }
            if (videoData.running === ClockState.RUNNING)
                this.state = ClockState.RUNNING;
            else if (this.state === ClockState.RUNNING)
                this.state = ClockState.PAUSED;
        }
        // currentTime().then((v) => {
        //     if (v !== undefined && v.code !== "-1") {
        //         const current = new SMPTE(v.timecode, 1000); // Set framerate to 1000 as we have no way of getting the framerate
        //         if (
        //             this.state === ClockState.RUNNING &&
        //             this.syncData.lastTime.equals(current, true)
        //         ) {
        //             this.state = this.syncData.lastRequest;
        //             this.syncData.lastRequest = ClockState.PAUSED;
        //         } else if (!this.syncData.lastTime.equals(current, true)) {
        //             this.syncData.lastTime = current;
        //             if (this.state !== ClockState.RUNNING)
        //                 this.state = ClockState.RUNNING;
        //         }
        //     }
        // });
    }

    setData(data: any): void {
        if (data.displayName) this.settings.displayName = data.displayName;
        if (data.channel) this.settings.channel = data.channel;
        if (data.direction) this.settings.direction = data.direction;
    }

    // prettier-ignore
    private lastRequest: ClockState | undefined;
    identifier: ClockIdentifier;
    type: string = "videoctrl";
    settings: BaseClockSettings & VideoCtrlData;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
}
