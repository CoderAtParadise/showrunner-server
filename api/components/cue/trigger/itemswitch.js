const eventhandler = require("../../event");

module.exports = (item) => {
  return {
    item: item,
    trigger: false,
    check: () => {
      eventhandler.on("itemswitch", (item) => {
        if (this.item === item) this.triggered = true;
      });
      return this.triggered;
    },
  };
};
