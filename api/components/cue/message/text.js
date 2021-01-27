const eventhandler = require("../event");

module.exports = (target, message) => {
  eventhandler.emit("cue", target, message);
};

/*
const text_message_example = {
  type: "text",
  text: "",
};
*/
