let triggers = new Map();

function registerTrigger(type,cb) {
    triggers.set(type,cb);
}

module.exports = (trigger) => {
    if(!triggers.has(trigger.trigger_type)) {
        console.error(`Unknown trigger type: ${trigger.trigger_type}`);
        return;
    }
    return triggers.get(trigger.trigger_type)(trigger);
}

registerTrigger("clock",require("./cue/trigger/clock"));
registerTrigger("itemswitch",require('./cue/trigger/itemswitch'));
registerTrigger("manual",require("./cue/trigger/manual"));
registerTrigger("timer",require('./cue/trigger/timer'));