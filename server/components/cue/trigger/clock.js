const { Timepoint } = require("../../timer");

module.exports = (trigger) => {
  return {
    time: Timepoint.parse(trigger.time),
    check: () => {
      return Timepoint.now().equals(this.time);
    },
  };
};
