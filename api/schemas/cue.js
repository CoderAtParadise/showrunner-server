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

timer_message = {
  type: "timer",
  timer: "", //timer to modify
  command: "start | stop",
  countdown: false,
  overflow: true, //whether the timer can overflow into negative on countdown
  duration: "0:00:00", //required for down
};

let timers = new Map();
const handleTimerMessage = (message) => {
  if (!timers.has(message.timer)) timers.set(message.timer, new Timer());
  let timer = timers.get(message.timer);
  switch (message.command) {
    case "start":
      message.countdown
        ? (timer.countdown = message.overflow)
        : (timer.countdown = false);
      message.overflow
        ? (timer.overflowAllowed = message.overflow)
        : (timer.overflowAllowed = false);
      message.duration
        ? (timer.timepoint = Timepoint.parse(message.duration))
        : (timer.timepoint = Object.assign({}, Timepoint.zeroTime));
      timer.start();
      break;
    case "unpause":
      timer.unpause();
      break;
    case "pause":
      timer.pause();
    case "stop":
    default:
      timer.stop();
      break;
  }
};

let messageHandlers = new Map();
function registerMessageHandler(type, handler) {
  messageHandlers.set(type, handler);
}

function handleMessage(message) {
  if (!messageHandlers.has(message.type))
    console.log(`Unknown message type: ${message}`);
  messageHandlers.get(message.type)(message);
}
