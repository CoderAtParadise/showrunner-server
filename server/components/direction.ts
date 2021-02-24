import { Item } from "./item";
import {IMessage,messageHandlers} from "./message";
import {ITrigger,triggerHandlers} from "./trigger";
import IJson from "./IJson";


export class Direction {
  item?: Item;
  targets: string[];
  trigger: ITrigger;
  message: IMessage;
  hasRun: boolean = false;

  constructor(targets: string[], trigger: ITrigger, message: IMessage) {
    this.targets = targets;
    this.trigger = trigger;
    this.message = message;
  }

  shouldNotify() {
    return !this.hasRun ? this.trigger.check() : false;
  }

  notify() {
    this.targets.forEach((target: string) => {
      const messageHandler = messageHandlers.get(this.message.type);
      if (!messageHandlers)
        console.log(`Unknown message type: ${this.message.type}`);
      else messageHandler?.handleMessage(target, this.message);
    });
    this.trigger.reset();
    this.hasRun = true;
  }
}

export const DirectionJson: IJson<Direction> = {
  serialize(value: Direction): object {
    return {
      targets: value.targets,
      trigger: triggerHandlers.get(value.trigger.type)?.json.serialize(value.trigger),
      message: messageHandlers
        .get(value.message.type)
        ?.json.serialize(value.message),
    };
  },

  deserialize(json: object): Direction {
      const value = json as {
        targets: string[];
        trigger: { type: string };
        message: { type: string };
      };
      const trigger = triggerHandlers.get(value.trigger.type)?.json.deserialize(value.trigger);
      const message = messageHandlers
        .get(value.message.type)
        ?.json.deserialize(value.message);
      return new Direction(value.targets, trigger, message);
  },
};
