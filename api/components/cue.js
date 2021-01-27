const eventhandler = require("./event");
const { getTimer, Timepoint } = require("./timer");

class Cue {
  constructor(props = { notify: [], trigger: {}, message: {} }) {
    const defaults = {
      notify: [],
      trigger: {},
      message: {},
    };
    props = Object.assign(defaults, props);
    this.notify = props.notify;
    this.trigger = props.trigger;
    this.message = props.message;
    this.run = false;
  }

  shouldTrigger() {
    return !this.run ? this.trigger.check() : false;
  }

  notify() {
    this.notify.forEach((target) => {
      handleMessage(target, this.message);
    });
    this.run = true;
  }
}

let messageHandlers = new Map();
function registerMessageHandler(type, handler) {
  messageHandlers.set(type, handler);
}

function handleMessage(target, message) {
  if (!messageHandlers.has(message.message_type)) {
    console.error(`Unknown message type: ${message.message_type}`);
    return;
  }
  messageHandlers.get(message.message_type)(target, message);
}

module.exports = {
  registerMessageHandler: registerMessageHandler,
};
