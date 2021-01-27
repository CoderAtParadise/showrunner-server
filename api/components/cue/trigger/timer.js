const eventhandler = require("../../event");
const { getTimer, Timepoint } = require("./timer");

module.exports = (timer, time) => {
  return {
    timer: timer,
    time: Timepoint.parse(time),
    triggered: false,
    check: () => {
      eventhandler.on("timer", () => {
        let timer = getTimer(this.timer);
        if (timer) {
          if (timer.isAtTimepoint(time)) this.trigger = true;
        }
      });
      return this.trigger;
    },
  };
};
