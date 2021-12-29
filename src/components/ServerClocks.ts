import { ClockSource } from "@coderatparadise/showrunner-common";
import { FallbackSyncClockSource } from "./SyncClockSource";
/**
 * Sync Clock used for syncronizing
 */
let syncClock: ClockSource = FallbackSyncClockSource;

export const setSyncClock = (clock: ClockSource): void => {
    syncClock = clock;
};

/**
 * @returns The Master Clock
 */
export const getSyncClock = (): ClockSource => {
    return syncClock;
};
