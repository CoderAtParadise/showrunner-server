const express = require("express");
const router = express.Router();
const { getTimer, getTimers, Timepoint } = require("../components/timer");
const { eventhandler, cueNext } = require("../components/event");
const upgradeSSE = require("../components/upgradeSSE");

const sendTimers = (map) => {
  let obj = { clock: Timepoint.stringify(Timepoint.now()), timers: [] };
  for (let [k, v] of map) obj.timers.push({ id: k, time: v.stringify() });
  return JSON.stringify(obj);
};

router.get("/timers", async (req, res) => {
  upgradeSSE(res);
  eventhandler.on("timer", () => {
    res.write(`event: timer\ndata: ${sendTimers(getTimers)}\n\n`);
  });
});

router.post("/timer/create", (req, res, next) => {});

router.get("/clock",(req,res,next) => {
  res.status(200).json({ time: Timepoint.stringify(Timepoint.now()) });
})

router.get("/timer/:id", (req, res, next) => {
  let timer = getTimer(req.params.id);
  if (!timer) {
    res.status(404).json({
      error: true,
      message: `No timer exists with id: ${req.params.id}`,
    });
    return;
  }

  let command = req.query.command;
  if (!command) {
    res.status(200).json(timer.status());
    return;
  }

  switch (command) {
    case "start":
      cueNext(() => timer.start());
      res.status(200).json(timer.status(true));
      break;
    case "stop":
      cueNext(() => timer.stop());
      res.status(200).json(timer.status(false));
      break;
    case "reset":
      cueNext(() => timer.reset());
      res.status(200).json(timer.status(false));
      break;
    case "restart":
      cueNext(() => timer.restart());
      res.status(200).json(timer.status(true));
      break;
    default:
      res.status(400).json({
        error: true,
        message: `Unknown Timer Command: ${req.params.id}`,
      });
  }
});

module.exports = router;
