const { json } = require("express");
const EventEmitter = require("events");
const express = require("express");
const { getTimer,getTimers,Timepoint } = require("../components/timer");
const router = express.Router();
const eventhandler = require('../components/event');

const sendTimers = (map) => {
  let obj = { clock: Timepoint.stringify(Timepoint.now()), timers: [] };
  for (let [k, v] of map) obj.timers.push({ id: k, time: v.stringify() });
  return JSON.stringify(obj);
};

router.get("/timers", async (req, res) => {
  res.set({
    "Cache-Control": "no-cache",
    "Conten-Type": "text/event-stream",
    'Connection': "keep-alive",
  });
  res.flushHeaders();
  res.write("retry: 10000\n\n");
  eventhandler.on("timer", () => {
      res.write(`event: timer\ndata: ${sendTimers(getTimers)}\n\n`);
  });
});

router.get("/timer/create",(req,res,next) => {

});

router.get("/timer/:id", (req, res, next) => {
  let command = req.query.command;
  if (!command) {
    res
      .status(400)
      .json({ error: true, message: "Missing query parameter: 'command'" });
    return;
  }
  let timer = getTimer(req.params.id);
  if (!timer) {
    res
      .status(404)
      .json({ error: true, message: `No timer exists with id: ${req.params.id}` });
    return;
  }
  switch (command) {
    case "start":
      timer.start();
      res.status(200).json({ error: false, message: `Started timer: ${req.params.id}}` });
      break;
    case "stop":
      timer.stop();
      res.status(200).json({ message: `Stopped timer: ${req.params.id}` });
      break;
    case "reset":
        timer.reset();
        res.status(200).json({message: `Reset timer: ${req.params.id}` });
        break;
    case "restart":
        timer.restart();
        res.status(200).json({ message: `Restarted timer: ${req.params.id}` });
        break;
    case "delete":
        break;
    default:
        res.status(400).json({error:true,message: `Unknown Timer Command: ${req.params.id}`});
  }
});

module.exports = router;
