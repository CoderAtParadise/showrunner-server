import {ITrigger,IHandler,registerHandler} from "../../common/ITrigger";

const switch_item_trigger: string = "switch:item";

const itemTriggerHandler: IHandler = {
  JSON: {
    serialize(value: ITrigger): object {
      return {
        type: switch_item_trigger,
      };
    },
    deserialize(json: object): ITrigger {
      const obj = {
        type: switch_item_trigger,
      };
      return obj;
    },
  },
};
registerHandler(switch_item_trigger, itemTriggerHandler);
