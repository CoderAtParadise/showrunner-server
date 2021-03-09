import { eventhandler } from "./eventhandler";
import IJson from "./IJson";

namespace Trigger {
  export interface ITrigger {
    type: string;
  }

  export interface IHandler {
    json: IJson<ITrigger>;
  }

  export const handlers = new Map<string, IHandler>();

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
