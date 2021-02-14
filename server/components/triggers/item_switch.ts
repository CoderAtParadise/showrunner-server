import {
  ITrigger,
  ITriggerHandler,
  registerTriggerHandler,
} from "../trigger";
import { eventhandler } from "../eventhandler";

class switch_item implements ITrigger {
  type: string = "switch:item";
  run: boolean = false;

  check() {
    eventhandler.on("switch:item", () => {
      this.run = true;
    });
    return this.run;
  }

  reset() {
    this.run = false;
  }
}

const itemTriggerHandler: ITriggerHandler<switch_item> = {
  json: {
    serialize(value: switch_item): object {
      return {
        type: value.type,
      };
    },
    deserialize(json: object): switch_item {
      return new switch_item();
    },
  },
};
registerTriggerHandler("switch:item",itemTriggerHandler);