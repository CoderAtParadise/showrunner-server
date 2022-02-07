import {
    ClockState,
    ClockSource,
    SMPTE
} from "@coderatparadise/showrunner-common";
import udp, { Socket } from "dgram";
import Debug from "debug";

export class AmpCtrlClock implements ClockSource {
    constructor(address: string, port: number) {
        this.address = address;
        this.port = port;
        this.server = udp.createSocket("udp4");
        this.createServer();
    }

    current(): SMPTE {
        return new SMPTE();
    }

    start(): void {}

    pause(): void {}

    stop(): void {}
    reset(): void {}

    update(): void {
        // let secOnly = Math.floor(this.rawTime);
    }

    data(): object | undefined {
        return undefined;
    }

    private createServer() {
        this.server.on("error", (err) => {
            Debug("showrunner:amp")(err);
            this.server.close();
        });
        this.server.on("message", (message) => {
            this.rawTime = message.readFloatBE();
        });
        this.server.on("listening", () => {
            this.state = ClockState.RUNNING;
        });
        this.server.on("close", () => {});
        this.server.bind(this.port, this.address);
    }

    owner: string = "system";
    show: string = "system";
    id: string = "ampctrl";
    type: string = "ampctrl";
    displayName: string = "Video Sync Clock";
    overrun: boolean = false;
    automation: boolean = false;
    state: ClockState = ClockState.STOPPED;
    private server: Socket;
    private address: string;
    private port: number;
    private rawTime?: number;
}
