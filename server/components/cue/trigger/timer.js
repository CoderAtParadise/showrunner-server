const eventhandler = require("../../event");
const { getTimer, Timepoint } = require("../../timer");

module.exports = (trigger) => {
  return {
    timer: trigger.timer,
    time: Timepoint.parse(trigger.time),
    triggered: false,
    check: () => {
      eventhandler.on("timer", () => {
        let timer = getTimer(this.timer);
        if (timer) {
          if (timer.isAtTimepoint(this.time)) this.trigger = true;
        }
      });
      return this.trigger;
    },
  };
};
