const eventhandler = require("./event");
const { getTimer, Timepoint } = require("./timer");
const fileHelper = require("./file_helper");
const handleMessage = require("./messages");

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

let currentItem = 0;
let currentCue = -1;

let Items = [];

const move = (arr,from,to) => {
  if(to === from) return arr;
  let target = arr[from];
  arr.splice(from,1);
  arr.splice(to,0,target);
}

class Item {
  constructor(id) {
    this.id = id;
    this.display = {};
    this.timers = [];
    this.personnel = [];
    this.notify = [];
  }

  static parse(obj) {
  }
}

module.exports = {
  getCurrentItem: "",
  getNextItem: "",
}