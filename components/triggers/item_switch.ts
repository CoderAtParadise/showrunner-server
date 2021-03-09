import Trigger from "../trigger";
import { eventhandler } from "../eventhandler";

const switch_item_trigger: string = "switch:item";

const itemTriggerHandler: Trigger.IHandler = {
  json: {
    serialize(value: Trigger.ITrigger): object {
      return {
        type: switch_item_trigger,
      };
    },
    deserialize(json: object): Trigger.ITrigger {
      const obj = {
        type: switch_item_trigger,
      };
      return obj;
    },
  },
};
Trigger.registerHandler(switch_item_trigger, itemTriggerHandler);
