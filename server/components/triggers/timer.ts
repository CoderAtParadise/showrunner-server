import {Trigger} from "../direction";
import { eventhandler } from "../eventhandler";
import { getTimer, Timepoint } from "../timer";

class timer implements Trigger {
    type:string = "control:timer";
    timer: string;
    time:Timepoint;
    run: boolean = false;
    constructor(timer:string,time:Timepoint) {
        this.timer = timer;
        this.time = time;
    }

    check() {
        eventhandler.on("timer",() => {
            const timer = getTimer(this.timer);
            if(timer) {
                if(timer.isAtTimepoint(this.time)) this.run = true;
            }
        });
        return this.run;
    }

    reset() {
        this.run = false;
    }
}