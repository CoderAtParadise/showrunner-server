import {
    AmpChannel,
    CurrentTimeSense,
    IDDurationRequest,
    IDLoadedRequest,
    ListFirstID,
    ListNextID
} from "@coderatparadise/amp-grassvalley";
import {
    ClockDirection,
    ClockState,
    SMPTE
} from "@coderatparadise/showrunner-common";
import { AmpCtrlClock } from "../clock/AmpCtrlClockSource";
import { VideoCtrlClockSource } from "../clock/VideoCtrlClockSource";
import { ExternalSource } from "./ExternalSourceManager";
import { globalShowHandler } from "./GlobalShowHandler";
import { v4 as uuidv4 } from "uuid";
import { CreateCommand } from "../command/clock/Create";

export interface VideoData {
    id: string;
    duration: SMPTE;
    incorrectFramerate: boolean;
    running: ClockState;
}

export class AmpChannelSource implements ExternalSource<AmpChannel> {
    constructor(
        id: string,
        name: string,
        address: string,
        port: number,
        framerate?: number,
        channel?: string,
        retry?: { maxRetries: number; timeBetweenRetries: number[] }
    ) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.port = port;
        this.framerate = framerate || 25;
        this.channel = channel;
        this.maxRetries = retry?.maxRetries || 10;
        this.timeBetweenRetries = retry?.timeBetweenRetries || [10000];
    }

    async open(retryHandler: () => Promise<boolean>): Promise<boolean> {
        this.source = new AmpChannel(this.address, this.port, this.channel);
        this.videoCache.clear();
        this.current = { id: "", time: new SMPTE(), raw: "" };
        const open = await this.source.open(retryHandler);
        if (open) this.update();

        return open;
    }

    isOpen(): boolean {
        return this.source?.isOpen() || false;
    }

    close(): void {
        this.source?.close(false);
        this.videoCache.clear();
        this.current = { id: "", time: new SMPTE(), raw: "" };
    }

    restart(): void {
        this.source?.close(true);
        this.videoCache.clear();
        this.current = { id: "", time: new SMPTE(), raw: "" };
    }

    get(): AmpChannel {
        if (this.source) return this.source;
        throw new Error("Amp Channel not open");
    }

    data(id: string, dataid?: string): any {
        if (id === "video") {
            if (dataid !== undefined) return this.videoCache.get(dataid);
            else return this.videoCache;
        } else if (id === "current") {
            if (dataid === "id") return this.current.id;
            else if (dataid === "time") return this.current.time;
            else return this.current;
        }
    }

    configure(newSettings?: object): object {
        if (newSettings !== undefined) {
            // if(newSettings.maxRetries)
        }
        return {
            id: this.id,
            maxRetries: this.maxRetries,
            timeBetweenRetries: this.timeBetweenRetries,
            name: this.name,
            address: this.address,
            port: this.port,
            channel: this.channel,
            framerate: this.framerate
        };
    }

    private pollCurrentInfo() {
        const currentTime = async () => {
            return await (
                await this.get().sendCommand(CurrentTimeSense)
            ).data;
        };
        const currentID = async () => {
            return await (
                await this.get().sendCommand(IDLoadedRequest)
            ).data;
        };
        currentID().then((v) => {
            if (this.current.id !== v.name) {
                const data = this.data("video", this.current.id) as VideoData;
                if (data !== undefined) data.running = ClockState.RESET;

                this.current.id = v.name;
            }
        });
        currentTime().then((v) => {
            const current = new SMPTE(v.timecode, this.framerate);
            if (this.lastChange === -1) this.lastChange = Date.now();
            const data = this.data("video", this.current.id) as VideoData;
            if (data !== undefined) {
                if (this.current.raw !== v.timecode) {
                    data.running = ClockState.RUNNING;
                    this.lastChange = Date.now();
                } else if (
                    this.current.raw === v.timecode &&
                    Date.now() - this.lastChange > 1000 / this.framerate
                ) {
                    if (data.running !== ClockState.RESET) {
                        data.running = ClockState.PAUSED;
                        if (data.duration.equals(current, true))
                            data.running = ClockState.STOPPED;
                    }
                }
            }
            this.current.time = current;
            this.current.raw = v.timecode;
            if (current.isIncorrectFramerate()) {
                const video: VideoData = this.videoCache.get(
                    this.current.id
                ) as VideoData;
                if (video !== undefined)
                    video.incorrectFramerate = current.isIncorrectFramerate();
            }
        });
    }

    private pollVideoData() {
        const firstId = async () => {
            return await (
                await this.get().sendCommand(ListFirstID, {
                    byteCount: "2"
                })
            ).data;
        };

        const nextId = async () => {
            return await (
                await this.get().sendCommand(ListNextID, {
                    data: { count: 255 }
                })
            ).data;
        };

        const getDuration = async (id: string) => {
            if (id !== undefined) {
                return await (
                    await this.get().sendCommand(IDDurationRequest, {
                        data: { clipName: id }
                    })
                ).data;
            }
            return { timecode: "00:00:00:00" };
        };
        let allVideos: string[] = [];
        firstId()
            .then((v) => {
                return v;
            })
            .then((v: any) => {
                allVideos = [...v.clipNames];
            })
            .then(() => {
                nextId()
                    .then((v) => {
                        allVideos = [...allVideos, ...v.clipNames];
                    })
                    .then(() => {
                        const keys = Array.from(this.videoCache.keys());
                        const allFound = allVideos.every((id: string) =>
                            keys.includes(id)
                        );
                        if (!allFound) {
                            allVideos.forEach(async (id: string) => {
                                const timecode = await (
                                    await getDuration(id)
                                ).timecode;
                                const duration = new SMPTE(
                                    timecode,
                                    this.framerate
                                );
                                this.videoCache.set(id, {
                                    id,
                                    duration,
                                    incorrectFramerate:
                                        duration.isIncorrectFramerate(),
                                    running: ClockState.RESET
                                });
                                CreateCommand.run(
                                    {
                                        show: "system",
                                        session: "system"
                                    },
                                    {
                                        type: "videoctrl",
                                        id,
                                        owner: "",
                                        channel: this.id,
                                        source: id,
                                        displayName: "Video Sync Clock",
                                        direction: ClockDirection.COUNTUP
                                    }
                                );
                            });
                        }
                    })
                    .then(() => {
                        if (
                            globalShowHandler().getValue("clocks", this.id) ===
                            undefined
                        ) {
                            CreateCommand.run(
                                {
                                    show: "system",
                                    session: "system"
                                },
                                {
                                    type: "ampctrl",
                                    id: this.id,
                                    owner: "",
                                    channel: this.id,
                                    displayName: "Video Sync Clock",
                                    direction: ClockDirection.COUNTUP
                                }
                            );
                        }
                    });
            });
    }

    update() {
        setInterval(() => {
            if (this.isOpen()) this.pollVideoData();
        }, 1000);
        setInterval(() => {
            if (this.isOpen()) this.pollCurrentInfo();
        }, 1000 / 30);
    }

    id: string;
    type: string = AmpChannel.name;
    maxRetries: number;
    timeBetweenRetries: number[];
    name: string;
    address: string;
    port: number;
    framerate: number;
    channel: string | undefined;
    source: AmpChannel | undefined = undefined;
    tryCounter: number = 0;
    private current: { id: string; time: SMPTE; raw: string } = {
        id: "",
        time: new SMPTE(),
        raw: ""
    };

    private videoCache: Map<string, VideoData> = new Map<string, VideoData>();
    private lastChange: number = -1;
}
