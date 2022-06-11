import { Codec, ClockSource } from "@coderatparadise/showrunner-common";
import { encodeData } from "../../util/LooseObject";

export const ClockSourceFileCodec: Codec<ClockSource<any>> = {
    serialize(clock: ClockSource<any>): object {
        const serObj = {
            type: clock.type,
            identifier: clock.identifier,
            settings: encodeData(clock.settings())
        };
        return serObj;
    },

    deserialize: function (): ClockSource<any> {
        throw new Error("Function not implemented.");
    }
};
