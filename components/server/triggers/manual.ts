import {ITrigger,IHandler,registerHandler} from "../../common/ITrigger";

const manual_trigger: string = "control:manual";

const manual: ITrigger = {
  type: manual_trigger
};

const manualTriggerHandler: IHandler = {
  JSON: {
    serialize(value:ITrigger): object {
      return {
        type: manual_trigger,
      };
    },
    deserialize(json: object): ITrigger {
      return manual;
    },
  },
};

registerHandler(manual_trigger, manualTriggerHandler);
