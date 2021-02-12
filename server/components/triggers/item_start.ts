import {Trigger} from "../direction";
import { eventhandler } from "../eventhandler";
import Debug from "debug";
const debug = Debug("showrunner:item_switch");

class item_start implements Trigger {
    type = "item_start";
    run = false;
    check() {
        eventhandler.on("item_switch",() => {
            this.run = true;
        }) 
        return this.run;
    }

    reset() {
        this.run = false;
    }
}

let a = new item_start();
a.check();
eventhandler.emit("item_switch");