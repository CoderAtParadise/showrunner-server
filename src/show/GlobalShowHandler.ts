import { ListFirstID, ListNextID } from "@coderatparadise/amp-grassvalley";
import {
    ShowHandler,
    ClockSource,
    getSyncClock,
    History,
    ClockDirection
} from "@coderatparadise/showrunner-common";
import { AmpCtrlClock } from "../clock/AmpCtrlClockSource";
import { VideoCtrlClockSource } from "../clock/VideoCtrlClockSource";
import { EventHandler } from "../Scheduler";
import { loadClocks, saveClocks } from "../util/FileHandler";
import { videoCache } from "./AmpChannelSource";
import { externalSourceManager } from "./ExternalSourceManager";

class GlobalShowHandler implements ShowHandler {
    tick(): void {
        this.clocks.forEach((value: ClockSource<any>) => value.update());
    }

    history(): History[] {
        return [];
    }

    writeHistory(): boolean {
        return false;
    }

    undoHistory(): boolean {
        return false;
    }

    isDirty(): boolean {
        return this.dirty;
    }

    markDirty(dirty: boolean): void {
        this.dirty = dirty;
    }

    get(key: string): any[] {
        switch (key) {
            case "clocks":
                return Array.from(this.clocks.values());
        }
        return [];
    }

    getValue(key: string, id: string): any {
        switch (key) {
            case "clocks":
                return this.clocks.get(id);
        }
        return undefined;
    }

    setValue(key: string, value: any): void {
        switch (key) {
            case "clocks":
                // eslint-disable-next-line no-case-declarations
                const clock = value as ClockSource<any>;
                this.clocks.set(clock.identifier.id, clock);
                break;
        }
    }

    id: string = "system";
    displayName: string = "System";
    location: string = "system";
    private dirty: boolean = false;
    private clocks: Map<string, ClockSource<any>> = new Map<
        string,
        ClockSource<any>
    >();
}

export const initGlobalShowHandler = (): void => {
    if (mGlobalShowHandler === undefined) {
        mGlobalShowHandler = new GlobalShowHandler();
        mGlobalShowHandler.setValue("clocks", getSyncClock());
        mGlobalShowHandler.setValue(
            "clocks",
            new AmpCtrlClock(
                {
                    show: "system",
                    session: "system",
                    owner: "system",
                    id: "PVS"
                },
                {
                    channel: "PVS",
                    displayName: "Video Sync Clock",
                    direction: ClockDirection.COUNTUP,
                    automation: false
                }
            )
        );
        mGlobalShowHandler.setValue(
            "clocks",
            new VideoCtrlClockSource(
                {
                    show: "system",
                    session: "system",
                    owner: "system",
                    id: "testvideo"
                },
                {
                    channel: "PVS",
                    displayName: "Video Test Clock",
                    source: "TestVideo",
                    direction: ClockDirection.COUNTUP,
                    automation: false
                }
            )
        );
        EventHandler.on("clock", () => globalShowHandler().tick());
        loadClocks();
        setInterval(() => {
            if (mGlobalShowHandler.isDirty()) {
                saveClocks();
                mGlobalShowHandler.markDirty(false);
            }
        }, 5000);

        const fetchVideos = () => {
            videoCache.forEach((value: string[], key: string) => {
                const channel = externalSourceManager.getSource(key)?.get();
                let videos: string[];
                if (channel) {
                    channel
                        .sendCommand(ListFirstID, { byteCount: "2" })
                        .then((v: any | undefined) => {
                            if (v !== undefined && v.code !== "-1") {
                                videos = v.data.clipNames;
                                channel
                                    .sendCommand(ListNextID, {
                                        data: { count: 255 }
                                    })
                                    .then((lv: any) => {
                                        videos = videos.concat(
                                            lv.data.clipNames
                                        );
                                        videoCache.set(key, videos);
                                    });
                            }
                        });
                }
            });
        };
        setTimeout(() => {
            fetchVideos();
            setInterval(() => fetchVideos(), 300000);
        }, 3000);
    }
};

export const globalShowHandler = (): GlobalShowHandler => {
    initGlobalShowHandler();
    return mGlobalShowHandler;
};

let mGlobalShowHandler: GlobalShowHandler;

export default { initGlobalShowHandler, globalShowHandler };
