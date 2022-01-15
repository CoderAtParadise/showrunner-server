import { ClockSource } from "@coderatparadise/showrunner-common";
import { encodeData } from "./LooseObject";

export const encodeClockSouce = (clock: ClockSource): object => {
    return {
        type: clock.type,
        owner: clock.owner,
        show: clock.show,
        id: clock.id,
        display: clock.display,
        current: clock.current().toString(),
        framerate: clock.current().frameRate(),
        data: encodeData(clock.data() || {}),
        state: clock.state
    };
};
