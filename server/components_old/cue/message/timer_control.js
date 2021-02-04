const { getTimer, addTimer, Timer, Timepoint } = require("../../timer");
const { cueNext } = require("../../event");

module.exports = (message) => {
  let timer = getTimer(message.timer);
  if (!timer) {
    console.error(`Unknown Timer: ${message.timer}`);
    return;
  }
  switch (message.command) {
    case "start":
      cueNext(() => timer.start());
      break;
    case "reset":
      cueNext(() => timer.reset());
      break;
    case "restart":
      cueNext(() => timer.restart());
      break;
    case "stop":
    default:
      cueNext(() => timer.start());
      break;
  }
};
