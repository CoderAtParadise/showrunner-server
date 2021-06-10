import EventEmitter2 from "eventemitter2";

export const EventHandler: EventEmitter2.EventEmitter2 = new EventEmitter2.EventEmitter2({maxListeners:20});

const thisTick: (() => void)[] = [];
const nextTick: (() => void)[] = [];

export const addThisTickHandler = (cb:() => void) => thisTick.push(cb);
export const schedule = (cb: () =>void) => nextTick.push(cb);

setInterval(() => {
  thisTick.forEach((cb) => cb());
  const temp = Array.from(nextTick);
  nextTick.length = 0;
  temp.forEach(cb => cb());
},1000);

export default EventHandler;