
let messageHandlers = new Map();

function registerMessageHandler(type, handler) {
  messageHandlers.set(type, handler);
}

module.exports = (target, message) => {
    if (!messageHandlers.has(message.message_type)) {
      console.error(`Unknown message type: ${message.message_type}`);
      return;
    }
    messageHandlers.get(message.message_type)(target, message);
  }

registerMessageHandler("text",require("./cue/message/text"));
registerMessageHandler("timer",require('./cue/message/timer'));
