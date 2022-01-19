import {
    ClockState,
    ClockSource,
    SMPTE,
    setSyncClock,
    FallbackSyncClockSource
} from "@coderatparadise/showrunner-common";
import udp, { Socket } from "dgram";
import Debug from "debug";

interface VideoInformation {}

export class AmpCtrlClock implements ClockSource {
    constructor(address: string, port: number) {
        this.address = address;
        this.port = port;
        this.server = udp.createSocket("udp4");
        this.createServer();
    }
    setData: (data: any) => void;
    current: () => SMPTE;
    data: () => object | undefined;
    start: () => void;
    pause: () => void;
    stop: () => void;
    reset: () => void;

    update(): void {}

    private createServer() {
        this.server.on("error", (err) => {
            Debug("showrunner:amp")(err);
            this.server.close();
        });
        this.server.on("message", (message) => {
            // NO
        });
        this.server.on("close", () => {
        });
        this.server.bind(this.port, this.address);
    }

    owner: string = "system";
    show: string = "system";
    id: string = "ampctrl";
    type: string = "AmpCtrl";
    display: string = "Video Clock";
    state: ClockState = ClockState.STOPPED;
    private server: Socket;
    private address: string;
    private port: number;
    private info?: VideoInformation;
}
