import { ClockSource, SMPTE } from "@coderatparadise/showrunner-common";

export const VideoClockSource: ClockSource = {
    id: "video",
    clock(): SMPTE {
        return new SMPTE(new Date());
    },
    data(): object | undefined {
        return undefined;
    }
};

export default { VideoClockSource };
