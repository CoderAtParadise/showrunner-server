import IJson from "./IJson";

namespace Message {
  export interface IMessage {
    type: string;
  }

  export interface IHandler<T extends IMessage> {
    handleMessage: (target: string, message: T) => void;
    json: IJson<T>;
  }

  export const handlers = new Map<string, IHandler<any>>();

  export const registerHandler = (
    type: string,
    handler: IHandler<any>
  ) => {
    handlers.set(type, handler);
  };
}

export default Message;

import "./messages/text";
