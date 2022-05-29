import {
    ClockState,
    SMPTE,
    ClockDirection,
    MutableClockSource,
    BaseClockSettings,
    ClockIdentifier
} from "@coderatparadise/showrunner-common";
import {
    CurrentTimeSense,
    IDDurationRequest,
    IDLoadedRequest,
    InPreset,
    Play,
    Stop
} from "@coderatparadise/amp-grassvalley";
import { EventHandler } from "../Scheduler";
import { externalSourceManager } from "../show/ExternalSourceManager";

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

    current(): SMPTE {
        if (this.state === ClockState.RESET) return this.duration();
        switch (this.settings.direction) {
            case ClockDirection.COUNTUP:
                return this.syncData.lastTime;
            case ClockDirection.COUNTDOWN:
                return this.duration().subtract(this.syncData.lastTime, true);
        }
    }

    duration(): SMPTE {
        return this.syncData.duration;
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
        if (this.state !== ClockState.RESET) {
            externalSourceManager
                .getSource(this.settings.channel)?.get()!
                .sendCommand(Stop)
                .then(() => {
                    externalSourceManager
                        .getSource(this.settings.channel)?.get()!
                        .sendCommand(InPreset, {
                            byteCount: "A",
                            data: { clipName: "TestVideo copy" }
                        }).then(() => {
                            externalSourceManager.getSource(this.settings.channel)?.get()?.sendCommand(InPreset, {
                                byteCount: "A",
                                data: { clipName: this.syncData.currentID }
                            });
                        });
                });
            this.syncData.lastTime = new SMPTE("00:00:00:00");
            this.state = this.syncData.lastRequest = ClockState.RESET;
            EventHandler.emit("clock.reset", this.identifier);
        }
    }

    getBit(byte: number, bit: number): boolean {
        return (byte >> bit) % 2 === 0;
    }

    update(): void {
        const currentTime = async () => {
            const source = await externalSourceManager.getSource(this.settings.channel);
            if(source) {
            return await (
                await source?.get()!
                    .sendCommand(CurrentTimeSense)
            ).data;
            }
            return undefined;
        };

        const clipDuration = async () => {
            const source = await externalSourceManager.getSource(this.settings.channel);
            if(source) {
            return await (
                await source?.get()!
                    .sendCommand(IDDurationRequest, {
                        data: { clipName: this.syncData.currentID }
                    })
            ).data;
                }
            return undefined;
        };
        const currentId = async () => {
            const source = await externalSourceManager.getSource(this.settings.channel);
            if(source) {
                return await (
                source?.get()
                    .sendCommand(IDLoadedRequest)
            ).data;
            }
            return undefined;
        };
        currentId().then((v) => {
            if(v !== undefined && v.code !== "-1") {
            if (this.syncData.currentID !== v.name) {
                this.syncData.currentID = v.name;
                clipDuration().then((v) => {
                    this.syncData.duration = new SMPTE(v.timecode, 1000); // Set framerate to 1000 as we have no way of getting the framerate
                    EventHandler.emit(
                        `clock-update-${this.identifier.show}:${this.identifier.session}`,
                        this.identifier.id,
                        {additional: {data: {...this.data()}, duration: this.duration(), displayName: this.displayName()} }
                    );
                });
            }
        }
        });

        currentTime().then((v) => {
            if(v !== undefined && v.code !== "-1") {
            const current = new SMPTE(v.timecode, 1000); // Set framerate to 1000 as we have no way of getting the framerate
            if(current.isIncorrectFramerate() && !this.incorrectFramerate) this.incorrectFramerate = true; //Set is once
            if (
                this.state === ClockState.RUNNING &&
                this.syncData.lastTime.equals(current, true)
            ) {
                this.state = this.syncData.lastRequest;
                this.syncData.lastRequest = ClockState.PAUSED;
            } else if (!this.syncData.lastTime.equals(current, true)) {
                this.syncData.lastTime = current;
                if (this.state !== ClockState.RUNNING)
                    this.state = ClockState.RUNNING;
            }
        }
        });
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
    incorrectFramerate: boolean = false;
    // prettier-ignore
    private syncData: {
        lastTime: SMPTE;
        duration: SMPTE;
        currentID: string;
        lastRequest: ClockState;
    } = {
            lastTime: new SMPTE(),
            duration: new SMPTE(),
            currentID: "",
            lastRequest: ClockState.RESET
        };
}
