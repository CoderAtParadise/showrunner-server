import {
    ClockState,
    ClockSource,
    SMPTE
} from "@coderatparadise/showrunner-common";
import { CurrentTimeSense, Play } from "@coderatparadise/amp-grassvalley";
import { openChannels } from "./VideoClockManager";
import { Stop } from "@coderatparadise/amp-grassvalley/lib/cjs/Commands";

export class AmpCtrlClock implements ClockSource {
    constructor(channel: string = "") {
        this.channel = channel;
    }

    current(): SMPTE {
        const currentTime = async () => {
            return await (
                await openChannels.get("PVS")!.sendCommand(CurrentTimeSense)
            ).data;
        };
        currentTime().then((v) => {
            this.lastTime = new SMPTE(v.timecode, 30);
        });
        return this.lastTime;
    }

    start(): void {
        openChannels.get("PVS")!.sendCommand(Play, { byteCount: "0" });
    }

    pause(): void {
        openChannels.get("PVS")!.sendCommand(Stop, { byteCount: "0" }); // PVS pauses on stop and will resume where left off
    }

    stop(): void {
        // get current loaded
        // stop
        // reset
    }

    reset(): void {
        // openChannels.get("PVS")!.sendCommand() get current loaded
        openChannels
            .get("PVS")!
            .sendCommand(Stop)
            .then(() => {
                // Require last
            });
    }

    update(): void {
        // let secOnly = Math.floor(this.rawTime);
    }

    data(): object | undefined {
        return { channel: this.channel };
    }

    owner: string = "system";
    show: string = "system";
    id: string = "ampctrl";
    type: string = "ampctrl";
    displayName: string = "Video Sync Clock";
    overrun: boolean = false;
    automation: boolean = false;
    state: ClockState = ClockState.STOPPED;
    private channel: string;
    private lastTime: SMPTE = new SMPTE();
}
