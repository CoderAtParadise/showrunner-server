import { eventhandler } from "./eventhandler";
import IJson from "./IJson";

namespace Trigger {
  export enum State {
    WAITING,
    SCHEDULED,
    RUN,
  }

  export interface ITrigger {
    type: string;
    state: State;
    listener: { key: string; func: (...params: any) => void };
  }

  export interface IHandler {
    json: IJson<ITrigger>;
  }

  export const handlers = new Map<string, IHandler>();

  export const startListening = (trigger: ITrigger) => {
    eventhandler.on(trigger.listener.key, trigger.listener.func);
  };

  export const stopListening = (trigger: ITrigger) => {
    eventhandler.removeListener(trigger.listener.key, trigger.listener.func);
  };

  export const registerHandler = (
    type: string,
    handler: IHandler
  ) => {
    handlers.set(type, handler);
  };
}

export default Trigger;

import "./triggers/item_switch";
import "./triggers/manual";
