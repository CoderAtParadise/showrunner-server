import { ClockSource } from "@coderatparadise/showrunner-common";
import { encodeData } from "./LooseObject";

export const encodeClockSouce = (clock: ClockSource<any>): object => {
    return {
        type: clock.type,
        owner: clock.owner,
        session: clock.session,
        id: clock.id,
        current: clock.current().toString(),
        duration: clock.duration().toString(),
        framerate: clock.current().frameRate(),
        data: encodeData(clock.data?.() || {}),
        settings: encodeData(clock.settings),
        state: clock.state
    };
};
