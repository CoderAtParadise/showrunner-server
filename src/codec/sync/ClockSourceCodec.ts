import {
    Codec,
    ClockSource
} from "@coderatparadise/showrunner-common";
import { encodeData } from "../../util/LooseObject";

export const ClockSourceCodec: Codec<ClockSource<any>> = {
    serialize(clock: ClockSource<any>): object {
        const serObj = {
            type: clock.type,
            owner: clock.owner,
            id: clock.id,
            displayName: clock.displayName?.() || "",
            current: clock.current().toString(),
            duration: clock.duration().toString(),
            framerate: clock.current().frameRate(),
            data: encodeData(clock.data?.() || {}),
            settings: encodeData(clock.settings),
            state: clock.state
        };
        return serObj;
    },

    deserialize: function (): ClockSource<any> {
        throw new Error("Function not implemented.");
    }
};
