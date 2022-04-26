import {
    ClockState,
    SMPTE,
    ClockDirection,
    MutableClockSource
} from "@coderatparadise/showrunner-common";
import {
    CurrentTimeSense,
    IDDurationRequest,
    IDLoadedRequest,
    InPreset,
    Play,
    Stop
} from "@coderatparadise/amp-grassvalley";
import { openChannels } from "../show/AmpChannelManager";
import { EventHandler } from "../Scheduler";

// prettier-ignore
export class AmpCtrlClock implements MutableClockSource<{ channel: string; direction: ClockDirection }> {
    // prettier-enable
    constructor(id: string, channel: string, displayName: string) {
        this.id = id;
        this.settings = {
            displayName: displayName,
            channel: channel,
            direction: ClockDirection.COUNTUP
        };
    }

    displayName(): string {
        return this.syncData.currentID !== ""
            ? this.settings.channel + " - " + this.syncData.currentID
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
                openChannels
                    .get(this.settings.channel)
                    ?.sendCommand(InPreset, {
                        byteCount: "A",
                        data: { clipName: this.syncData.currentID }
                    })
                    .then(() => {
                        openChannels
                            .get(this.settings.channel)!
                            .sendCommand(Play, { byteCount: "0" });
                    });
            } else {
                openChannels
                    .get(this.settings.channel)!
                    .sendCommand(Play, { byteCount: "0" });
            }
            this.state = ClockState.RUNNING;
            EventHandler.emit("clock.pause", this.owner, this.id);
        }
    }

    pause(): void {
        if (this.state === ClockState.RUNNING) {
            openChannels
                .get(this.settings.channel)!
                .sendCommand(Stop, { byteCount: "0" }); // PVS pauses on stop and will resume where left off
            this.state = this.syncData.lastRequest = ClockState.PAUSED;
            EventHandler.emit("clock.pause", this.owner, this.id);
        }
    }

    stop(): void {
        if (
            this.state === ClockState.RUNNING ||
            this.state === ClockState.PAUSED
        ) {
            openChannels
                .get(this.settings.channel)!
                .sendCommand(Stop, { byteCount: "0" });
            this.state = this.syncData.lastRequest = ClockState.STOPPED;
            EventHandler.emit("clock.stop", this.owner, this.id);
        }
    }

    reset(): void {
        if (this.state !== ClockState.RESET) {
            openChannels
                .get(this.settings.channel)!
                .sendCommand(Stop)
                .then(() => {
                    openChannels
                        .get(this.settings.channel)!
                        .sendCommand(InPreset, {
                            byteCount: "A",
                            data: { clipName: "TestVideo copy" }
                        }).then(() => {
                            openChannels.get(this.settings.channel)?.sendCommand(InPreset, {
                                byteCount: "A",
                                data: { clipName: this.syncData.currentID }
                            });
                        });
                });
            this.syncData.lastTime = new SMPTE("00:00:00:00");
            this.state = this.syncData.lastRequest = ClockState.RESET;
            EventHandler.emit("clock.reset", this.owner, this.id);
        }
    }

    getBit(byte: number, bit: number): boolean {
        return (byte >> bit) % 2 === 0;
    }

    update(): void {
        const currentTime = async () => {
            return await (
                await openChannels
                    .get(this.settings.channel)!
                    .sendCommand(CurrentTimeSense)
            ).data;
        };

        const clipDuration = async () => {
            return await (
                await openChannels
                    .get(this.settings.channel)!
                    .sendCommand(IDDurationRequest, {
                        data: { clipName: this.syncData.currentID }
                    })
            ).data;
        };
        const currentId = async () => {
            return await (
                await openChannels
                    .get(this.settings.channel)!
                    .sendCommand(IDLoadedRequest)
            ).data;
        };
        currentId().then((v) => {
            if (this.syncData.currentID !== v.name) {
                this.syncData.currentID = v.name;
                clipDuration().then((v) => {
                    this.syncData.duration = new SMPTE(v.timecode, 1000); // Set framerate to 1000 as we have no way of getting the framerate
                });
            }
        });

        currentTime().then((v) => {
            const current = new SMPTE(v.timecode, 1000); // Set framerate to 1000 as we have no way of getting the framerate
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

    owner: string = "system";
    id: string;
    type: string = "ampctrl";
    // prettier-ignore
    settings: {
        displayName: string;
        channel: string;
        direction: ClockDirection;
    };

    overrun: boolean = false;
    automation: boolean = false;
    state: ClockState = ClockState.RESET;
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
