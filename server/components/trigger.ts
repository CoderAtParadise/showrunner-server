import IJson from "./IJson";

export interface ITrigger {
  type: string;
  check: () => boolean;
  reset: () => void;
}

export interface ITriggerHandler<T extends ITrigger> {
  json: IJson<T>;
}

export const triggerHandlers = new Map<string, ITriggerHandler<any>>();

export const registerTriggerHandler = (
  type: string,
  handler: ITriggerHandler<any>
) => {
  triggerHandlers.set(type, handler);
};

import "./triggers/item_switch";