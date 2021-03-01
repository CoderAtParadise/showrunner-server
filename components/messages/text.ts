import Message from "../message";
import { eventhandler } from "../eventhandler";

const text_type = "text";

class text implements Message.IMessage {
    type:string = text_type;
    message:string;
    constructor(message:string) {
        this.message = message;
    }
}

const text_handler: Message.IHandler<text> = {
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

Message.registerHandler(text_type,text_handler);