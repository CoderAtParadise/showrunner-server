import {IMessage,IHandler,registerHandler} from "../../common/IMessage";

const text_type = "text";

class text implements IMessage {
    type:string = text_type;
    message:string;
    constructor(message:string) {
        this.message = message;
    }
}

const text_handler: IHandler = {
    JSON: {
        serialize(value:IMessage): object {
            return value;
        },

        deserialize(json:object): IMessage {
            return json as text;
        }
    }
}

registerHandler(text_type,text_handler);