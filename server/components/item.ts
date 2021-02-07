import {TimerType,OverrunBehaviour, Timepoint} from "./timer";
import {Direction} from "./direction";

export class TimerSettings {
    type: TimerType;
    ref?: string;
    overrunBehaviour?: OverrunBehaviour;
    time?: Timepoint;
    showTime?: boolean = false;
    constructor(params: TimerSettings = {} as TimerSettings) {
        this.type = params.type;
        this.ref = params.ref;
        this.overrunBehaviour = params.overrunBehaviour;
        this.time = params.time;
        this.showTime = params.showTime;
    }
}

export class Item {
    id: string;
    index: number;
    clock: TimerSettings;
    directions: Direction[] = [];

    constructor(id: string,index: number,clock: TimerSettings) {
        this.id = id;
        this.index = index;
        this.clock = clock;
    }
}

let a = new TimerSettings({type:TimerType.COUNTDOWN});