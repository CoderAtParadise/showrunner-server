import Trigger from "../trigger";

const manual_trigger: string = "control:manual";

const manual: Trigger.ITrigger = {
  type: manual_trigger,
  state: Trigger.State.WAITING,
  listener: {
    key: "manual",
    func: () => {},
  },
};

const manualTriggerHandler: Trigger.IHandler = {
  json: {
    serialize(value: Trigger.ITrigger): object {
      return {
        type: manual_trigger,
      };
    },
    deserialize(json: object): Trigger.ITrigger {
      return manual;
    },
  },
};

Trigger.registerHandler(manual_trigger, manualTriggerHandler);
