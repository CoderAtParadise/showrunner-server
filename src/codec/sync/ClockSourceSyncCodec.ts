import { Codec, ClockSource } from "@coderatparadise/showrunner-common";
import { encodeData } from "../../util/LooseObject";

export const ClockSourceSyncCodec: Codec<ClockSource<any>> = {
    serialize(clock: ClockSource<any>): object {
        const serObj = {
            type: clock.type,
            identifier: clock.identifier,
            currentState: {
                current: clock.current().toString(),
                state: clock.status(),
                overrun: clock.isOverrun(),
                incorrectFramerate: clock.hasIncorrectFrameRate()
            },
            settings: encodeData(clock.settings()),
            additional: {
                displayName: clock.displayName?.() || "",
                duration: clock.duration().toString(),
                data: encodeData(clock.data()),
                framerate: clock.current().frameRate()
            }
        };
        return serObj;
    },

    deserialize: function (): ClockSource<any> {
        throw new Error("Function not implemented.");
    }
};
