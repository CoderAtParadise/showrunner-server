import EventEmitter from "events";
import Debug from "debug";
const debug = Debug("showrunner:eventhandler");

class EventHandler extends EventEmitter {
  emit(type: string, ...args: any) {
    debug(`Fired event "${type}"`);
    return super.emit(type, ...args) || super.emit("", ...args);
  }
}

export const eventhandler: EventHandler = new EventHandler();
const thisTick: (() => void)[] = [];
const nextTick: (() => void)[] = [];

export const addThisTickHandler = (cb:() => void) => thisTick.push(cb);
export const schedule = (cb: () =>void) => nextTick.push(cb);

setInterval(() => {
  thisTick.forEach((cb) => cb());
  nextTick.forEach(cb => cb());
  nextTick.length = 0;
},1000);

eventhandler.emit("derp");
