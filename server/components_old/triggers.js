let triggers = new Map();

function registerTrigger(type,cb) {
    triggers.set(type,cb);
}

module.exports = (trigger) => {
    if(!triggers.has(trigger.type)) {
        console.error(`Unknown trigger type: ${trigger.type}`);
        return;
    }
    return triggers.get(trigger.type)(trigger);
}

registerTrigger("clock",require("./cue/trigger/clock"));
registerTrigger("itemswitch",require('./cue/trigger/itemswitch'));
registerTrigger("manual",require("./cue/trigger/manual"));
registerTrigger("timer",require('./cue/trigger/timer'));