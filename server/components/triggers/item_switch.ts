import { ITrigger, ITriggerHandler, registerTriggerHandler } from "../trigger";
import { eventhandler } from "../eventhandler";

const switch_item_trigger: string = "switch:item";

class switch_item implements ITrigger {
  type: string = switch_item_trigger;
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
        type: switch_item_trigger,
      };
    },
    deserialize(json: object): switch_item {
      return new switch_item();
    },
  },
};
registerTriggerHandler(switch_item_trigger, itemTriggerHandler);
