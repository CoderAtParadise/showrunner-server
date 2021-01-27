const eventhandler = require("./event");
const { getTimer, Timepoint } = require("./timer");
const fileHelper = require('./file_helper');
const handleMessage = require('./messages');

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