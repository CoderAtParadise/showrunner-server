import ClockSource from "../common/ClockSource";
import { Point, Relative } from "../common/Time";

const InternalClockSource: ClockSource = {
  id: "internal",
  clock: (): Point => {
    const now = new Date();
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      relative: Relative.NONE,
    };
  },
};

export default InternalClockSource;
