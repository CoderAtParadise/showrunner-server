
let messageHandlers = new Map();

function registerMessageHandler(type, handler) {
  messageHandlers.set(type, handler);
}

registerMessageHandler("text",require("./cue/message/text"));
registerMessageHandler("timer_control",require('./cue/message/timer_control'));
registerMessageHandler("item_control",require("./cue/message/item_control"));


module.exports = (target, message) => {
    if (!messageHandlers.has(message.type)) {
      console.error(`Unknown message type: ${message.type}`);
      return;
    }
    messageHandlers.get(message.type)(target, message);
  }