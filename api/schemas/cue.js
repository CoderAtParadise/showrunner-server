const { Timer, Timepoint } = require("../components/timer");

cue = {
  notify: [], //Notify targets
  condition: {}, //automation trigger condition
  message: {}, //message for notify targets to recieve
};

condition_timer_at = {
  timer: "",
  time: "+/-0:00:00", //(+) front start of timer / (-) from end of timer
};

condition_manual = {};

text_message = {
  type: "text",
  text: "",
};

let messageHandlers = new Map();
function registerMessageHandler(type, handler) {
  messageHandlers.set(type, handler);
}

function handleMessage(message) {
  if (!messageHandlers.has(message.message_type)) {
    console.error(`Unknown message type: ${message}`);
    return;
  }
  messageHandlers.get(message.message_type)(message);
}
