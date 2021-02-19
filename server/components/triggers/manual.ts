import {ITrigger,ITriggerHandler,registerTriggerHandler} from "../trigger";

const manual_trigger:string = "control:manual";

class manual implements ITrigger {
    type: string = manual_trigger;
    
    check() {
        return false;
    }

    reset() {
        //NOOP
    }
}

const manualTriggerHandler : ITriggerHandler<manual> = {
    json: {
        serialize(value:manual): object {
            return {
                type: manual_trigger,
            };
        },
        deserialize(json:object): manual {
            return new manual();
        }
    }
}
registerTriggerHandler(manual_trigger,manualTriggerHandler);