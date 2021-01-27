const { getTimer,addTimer,Timer, Timepoint } = require("../timer");

const handleTimerMessage = (message) => {
  if (!getTimer(message.timer)) addTimer(message.timer, new Timer());
  let timer = getTimer(message.timer);
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
