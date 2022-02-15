import EventEmitter2 from "eventemitter2";

export const EventHandler: EventEmitter2.EventEmitter2 =
    new EventEmitter2.EventEmitter2({
        maxListeners: 20,
        wildcard: true,
        delimiter: "."
    });

const tickHandlers: (() => void)[] = [];
const scheduled: (() => void)[] = [];

export const registerTickHandler = (cb: () => void) => tickHandlers.push(cb);
export const schedule = (cb: () => void) => scheduled.push(cb);

setInterval(() => {
    EventHandler.emit("clock");
    // tickHandlers.forEach((cb) => cb());
    const temp = Array.from(scheduled);
    scheduled.length = 0;
    temp.forEach((cb) => cb());
}, 1000);

// registerTickHandler(() => );

export default { EventHandler, registerTickHandler, schedule };
