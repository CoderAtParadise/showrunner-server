export interface Trigger {
  type: string;
  check: () => boolean;
}

export interface Message {
  type: string;
}

export interface MessageHandler<T extends Message> {
  handleMessage: (target: string, message: T) => void;
}

const messageHandlers = new Map<string, MessageHandler<any>>();

export const registerMessageHandler = (type: string,handler: MessageHandler<any>) => {
    messageHandlers.set(type,handler);
}

export class Direction {
  targets: string[];
  trigger: Trigger;
  message: Message;
  hasRun = false;

  constructor(targets: string[], trigger: Trigger, message: Message) {
    this.targets = targets;
    this.trigger = trigger;
    this.message = message;
  }

  shouldNotify() {
    return !this.hasRun ? this.trigger.check() : false;
  }

  notify() {
    this.targets.forEach((target: string) => {
      let messageHandler = messageHandlers.get(this.message.type);
      if (!messageHandlers)
        console.log(`Unknown message type: ${this.message.type}`);
      else messageHandler?.handleMessage(target, this.message);
    });
    this.hasRun = true;
  }
}
