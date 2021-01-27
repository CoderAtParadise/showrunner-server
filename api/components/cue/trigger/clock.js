const { Timepoint } = require("../../timer");

module.exports = (time) => {
  return {
    time: Timepoint.parse(time),
    check: () => {
      return Timepoint.now().equals(this.time);
    },
  };
};
