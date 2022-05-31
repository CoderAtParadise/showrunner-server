import {
    ClockState,
    SMPTE,
    ClockDirection,
    MutableClockSource,
    BaseClockSettings,
    ClockIdentifier
} from "@coderatparadise/showrunner-common";
import { InPreset, Play, Stop } from "@coderatparadise/amp-grassvalley";
import { EventHandler } from "../Scheduler";
import { externalSourceManager } from "../show/ExternalSourceManager";
import { VideoData } from "../show/AmpChannelSource";

// prettier-ignore
export class AmpCtrlClock implements MutableClockSource<{ channel: string; direction: ClockDirection }> {
    // prettier-enable
    constructor(identifier: ClockIdentifier, settings: BaseClockSettings & {channel:string, direction:ClockDirection}) {
        this.identifier = identifier;
        this.settings = settings;
    }

    displayName(): string {
        return this.syncData.currentID !== ""
            ? `${this.settings.channel}-${this.syncData.currentID} \u0028${this.settings.displayName}\u0029`
            : this.settings.channel + " - " + this.settings.displayName;
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
        const current = externalSourceManager
            .getSource(this.settings.channel)
            ?.data("current", "time");
        if (this.state === ClockState.RESET) return this.duration();
        if (current !== undefined) {
            switch (this.settings.direction) {
                case ClockDirection.COUNTUP:
                    return current;
                case ClockDirection.COUNTDOWN:
                    return this.duration().subtract(current, true);
            }
        } else return new SMPTE();
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
        if (this.state !== ClockState.RUNNING) {
            if (this.state === ClockState.STOPPED) {
                externalSourceManager
                    .getSource(this.settings.channel)?.get()
                    ?.sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: this.syncData.currentID }
                    })
                    .then(() => {
                        externalSourceManager
                            .getSource(this.settings.channel)?.get()!
                            .sendCommand(Play, { byteCount: "0" });
                    });
            } else {
                externalSourceManager
                    .getSource(this.settings.channel)?.get()!
                    .sendCommand(Play, { byteCount: "0" });
            }
            this.state = ClockState.RUNNING;
            EventHandler.emit("clock.pause", this.identifier);
        }
    }

    setTime(time: SMPTE): void {
        // externalSourceManager.getSource(this.settings.channel)?.get().sendCommand(CueUpWithData,{byteCount: "4",data:{}})
    };

    pause(): void {
        if (this.state === ClockState.RUNNING) {
            externalSourceManager
                .getSource(this.settings.channel)?.get()!
                .sendCommand(Stop, { byteCount: "0" }); // PVS pauses on stop and will resume where left off
            this.state = this.syncData.lastRequest = ClockState.PAUSED;
            EventHandler.emit("clock.pause", this.identifier);
        }
    }

    stop(): void {
        if (
            this.state === ClockState.RUNNING ||
            this.state === ClockState.PAUSED
        ) {
            externalSourceManager
                .getSource(this.settings.channel)?.get()!
                .sendCommand(Stop, { byteCount: "0" });
            this.state = this.syncData.lastRequest = ClockState.STOPPED;
            EventHandler.emit("clock.stop", this.identifier);
        }
    }

    reset(): void {
            externalSourceManager
                .getSource(this.settings.channel)?.get()!
                .sendCommand(Stop, { byteCount: "0" })
                .then(() => {
                    externalSourceManager
                        .getSource(this.settings.channel)?.get()!
                        .sendCommand(InPreset, {
                            byteCount: "A",
                            data: { clipName: "TestVideo copy" }
                        }).then(() => {
                            externalSourceManager.getSource(this.settings.channel)?.get()?.sendCommand(InPreset, {
                                byteCount: "A",
                                data: { clipName: externalSourceManager.getSource(this.settings.channel)?.data("current", "id") }
                            });
                        });
                });
            this.state = this.syncData.lastRequest = ClockState.RESET;
            EventHandler.emit("clock.reset", this.identifier);
    }

    getBit(byte: number, bit: number): boolean {
        return (byte >> bit) % 2 === 0;
    }

    update(): void {
        const currentId = externalSourceManager.getSource(this.settings.channel)?.data("current", "id");
        if (currentId !== undefined) {
            const videoData = externalSourceManager.getSource(this.settings.channel)?.data("video", currentId) as VideoData;
            if (videoData !== undefined) {
                if (this.syncData.lastRequest !== undefined && this.syncData.lastRequest !== videoData.running) {
                    this.state = videoData.running = this.syncData.lastRequest;
                    this.syncData.lastRequest = undefined;
                }
                if (videoData.running === ClockState.RUNNING)
                    this.state = ClockState.RUNNING;
                else if (this.state === ClockState.RUNNING)
                    this.state = ClockState.PAUSED;
            }
        }
        // const currentTime = async () => {
        //     const source = externalSourceManager.getSource(this.settings.channel);
        //     if(source) {
        //     return await (
        //         await source?.get()!
        //             .sendCommand(CurrentTimeSense)
        //     ).data;
        //     }
        //     return undefined;
        // };

        // const clipDuration = async () => {
        //     const source = await externalSourceManager.getSource(this.settings.channel);
        //     if(source) {
        //     return await (
        //         await source?.get()!
        //             .sendCommand(IDDurationRequest, {
        //                 data: { clipName: this.syncData.currentID }
        //             })
        //     ).data;
        //         }
        //     return undefined;
        // };
        // const currentId = async () => {
        //     const source = await externalSourceManager.getSource(this.settings.channel);
        //     if(source) {
        //         return await (
        //         source?.get()
        //             .sendCommand(IDLoadedRequest)
        //     ).data;
        //     }
        //     return undefined;
        // };
        // currentId().then((v) => {
        //     if(v !== undefined && v.code !== "-1") {
        //     if (this.syncData.currentID !== v.name) {
        //         this.syncData.currentID = v.name;
        //         clipDuration().then((v) => {
        //             this.syncData.duration = new SMPTE(v.timecode, 1000); // Set framerate to 1000 as we have no way of getting the framerate
        //             EventHandler.emit(
        //                 `clock-update-${this.identifier.show}:${this.identifier.session}`,
        //                 this.identifier.id,
        //                 {additional: {data: {...this.data()}, duration: this.duration(), displayName: this.displayName()} }
        //             );
        //         });
        //     }
        // }
        // });

        // currentTime().then((v) => {
        //     if(v !== undefined && v.code !== "-1") {
        //     const current = new SMPTE(v.timecode, 1000); // Set framerate to 1000 as we have no way of getting the framerate
        //     if(current.isIncorrectFramerate() && !this.incorrectFramerate) this.incorrectFramerate = true; //Set is once
        //     if (
        //         this.state === ClockState.RUNNING &&
        //         this.syncData.lastTime.equals(current, true)
        //     ) {
        //         this.state = this.syncData.lastRequest;
        //         this.syncData.lastRequest = ClockState.PAUSED;
        //     } else if (!this.syncData.lastTime.equals(current, true)) {
        //         this.syncData.lastTime = current;
        //         if (this.state !== ClockState.RUNNING)
        //             this.state = ClockState.RUNNING;
        //     }
        // }
        // });
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
        lastRequest: ClockState | undefined;
    } = {
            currentID: "",
            lastRequest: undefined
        };
}
