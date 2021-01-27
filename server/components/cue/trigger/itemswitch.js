const eventhandler = require("../../event");

module.exports = (trigger) => {
  return {
    item: trigger.item,
    trigger: false,
    check: () => {
      eventhandler.on("itemswitch", (item) => {
        if (this.item === item) this.triggered = true;
      });
      return this.triggered;
    },
  };
};
