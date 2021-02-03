const eventhandler = new (require('events'))();

const thisTick = [];
const nextTick = [];

setInterval(() => {
    thisTick.forEach(cb => cb());
    nextTick.forEach(cb => cb());
    nextTick.length = 0;
},1000);
module.exports = {
    eventhandler: eventhandler,
    cueNext: (cb) => {
        nextTick.push(cb);
    },
    addThisTickHadler:(cb) => {
        thisTick.push(cb);
    }
};