import ClockSource from "../common/ClockSource";
import { TimePoint, Offset } from "../common/TimePoint";

const InternalClockSource: ClockSource = {
  id: "internal",
  clock: (): TimePoint => {
    const now = new Date();
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      offset: Offset.NONE,
    };
  },
};

export default InternalClockSource;
