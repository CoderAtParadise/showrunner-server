import EventEmitter from "events";

export const eventhandler: EventEmitter = new EventEmitter();
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
