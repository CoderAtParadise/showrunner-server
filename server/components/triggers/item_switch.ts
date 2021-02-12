import {Trigger} from "../direction";
import { eventhandler } from "../eventhandler";
import { Timepoint } from "../timer";

class item implements Trigger {
    type:string = "switch:item";
    run: boolean = false;

    check() {
        eventhandler.on("switch:item",() => {
            this.run = true;
        }) 
        return this.run;
    }

    reset() {
        this.run = false;
    }
}