import {
    ClockState,
    MutableClockSource,
    SMPTE
} from "@coderatparadise/showrunner-common";

interface VideoCtrlData {
    channel: string;
    video: string;
}

export class VideoCtrlClockSource implements MutableClockSource<VideoCtrlData> {
    constructor(
        owner: string,
        session: string,
        id: string,
        displayname: string,
        channel: string,
        video: string
    ) {
        this.owner = owner;
        this.session = session;
        this.id = id;
        this.settings = {
            displayName: displayname,
            channel: channel,
            video: video
        };
    }

    current: () => SMPTE;
    duration: () => SMPTE;
    data: () => object | undefined;
    start: () => void;
    pause: (override: boolean) => void;
    stop: (override: boolean) => void;
    reset: (override: boolean) => void;

    update(): void {

    }

    setData: (data: any) => void;

    owner: string;
    session: string;
    id: string;
    type: string = "videoctrl";
    settings: { displayName: string } & VideoCtrlData;
    state: ClockState = ClockState.RESET;
    overrun: boolean = false;
    automation: boolean = false;
}
