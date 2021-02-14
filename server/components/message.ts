import IJson from "./IJson";

export interface IMessage {
  type: string;
}

export interface IMessageHandler<T extends IMessage> {
  handleMessage: (target: string, message: T) => void;
  json: IJson<T>;
}

export const messageHandlers = new Map<string, IMessageHandler<any>>();

export const registerMessageHandler = (
  type: string,
  handler: IMessageHandler<any>
) => {
  messageHandlers.set(type, handler);
};