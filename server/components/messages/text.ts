import {IMessage,IMessageHandler, registerMessageHandler} from "../message";
import { eventhandler } from "../eventhandler";

const text_type = "text";

class text implements IMessage {
    type:string = text_type;
    message:string;
    constructor(message:string) {
        this.message = message;
    }
}

const text_handler: IMessageHandler<text> = {
    handleMessage(target:string,message:text): void {
        eventhandler.emit("direction",target,message);
    },

    json: {
        serialize(value:text): object {
            return value;
        },

        deserialize(json:object): text {
            return json as text;
        }
    }
}

registerMessageHandler(text_type,text_handler);