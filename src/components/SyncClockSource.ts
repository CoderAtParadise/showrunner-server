import { ClockSource, SMPTE } from "@coderatparadise/showrunner-common";

export const FallbackSyncClockSource: ClockSource = {
    id: "server_fallback",
    clock(): SMPTE {
        return new SMPTE(new Date());
    },
    data(): object | undefined {
        return undefined;
    }
};

export const ExternalSyncClockSource: ClockSource = {
    id: "external_sync",
    clock(): SMPTE {
        return new SMPTE(new Date());
    },
    data(): object | undefined {
        return undefined;
    }
};

export default { FallbackSyncClockSource, ExternalSyncClockSource };
