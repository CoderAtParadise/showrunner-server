const { Timer, Timepoint } = require("../timer");

let timers = new Map();

const getTimer = (id) => {
  console.log(id);
  console.log(timers.get(id));
  return timers.get(id);
};

const handleTimerMessage = (message) => {
  if (!timers.has(message.timer)) timers.set(message.timer, new Timer());
  let timer = timers.get(message.timer);
  switch (message.command) {
    case "create":
      timer.type = message.type;
      timer.overrun = message.overrun;
      timer.startpoint = Timepoint.parse(message.startpoint);
      timer.endpoint = Timepoint.parse(message.endpoint);
      timer.restart();
      break;
    case "start":
      timer.start();
      break;
    case "reset":
      timer.reset();
      break;
    case "restart":
      timer.restart();
      break;
    case "stop":
    default:
      timer.stop();
      break;
  }
};
const timer_message_example = {
  message_type: "timer",
  timer: "example",
  command: "create",
  type: "elapsed",
  overrun: false,
  startpoint: "00:00:00",
  endpoint: "--:--:--",
};

handleTimerMessage(timer_message_example);

module.exports = {
  getTimer: getTimer,
  allTimers: timers,
};
