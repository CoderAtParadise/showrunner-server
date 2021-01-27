const { json } = require("express");
var express = require("express");
const { getTimer, allTimers } = require("../components/messages/timer_message");
const { Timepoint } = require("../components/timer");
var router = express.Router();

const convertToObj = (map) => {
  let obj = { clock: Timepoint.stringify(Timepoint.now()), timers: [] };
  for (let [k, v] of map) obj.timers.push({ id: k, time: v.stringify() });
  return obj;
};

router.ws("/timers", (ws, req) => {
  ws.send(JSON.stringify(convertToObj(allTimers)));
});

router.get("/timers/create", (req, res, next) => {});

router.get("/timers/start", (req, res, next) => {
  let id = req.query.timer;
  if (!id) {
    res
      .status(400)
      .json({ error: true, message: "Missing query parameter: 'timer'" });
    return;
  }
  let timer = getTimer(id);
  if (!timer) {
    res
      .status(404)
      .json({ error: true, message: `No timer exists with id: ${id}` });
    return;
  }
  timer.start();
  res.status(200).json({ error: false, message: `Started timer: ${id}` });
});

router.get("/timers/stop", (req, res, next) => {
  let id = req.query.timer;
  if (!id) {
    res
      .status(400)
      .json({ error: true, message: "Missing query parameter: 'timer'" });
    return;
  }
  let timer = getTimer(id);
  if (!timer) {
    res
      .status(404)
      .json({ error: true, message: `No timer exists with id: ${id}` });
    return;
  }
  timer.stop();
  res.status(200).json({ error: false, message: `Stopped timer: ${id}` });
});

router.get("/timers/reset", (req, res, next) => {
  let id = req.query.timer;
  if (!id) {
    res
      .status(400)
      .json({ error: true, message: "Missing query parameter: 'timer'" });
    return;
  }
  let timer = getTimer(id);
  if (!timer) {
    res
      .status(404)
      .json({ error: true, message: `No timer exists with id: ${id}` });
    return;
  }
  timer.reset();
  res.status(200).json({ error: false, message: `Reset timer: ${id}` });
});

module.exports = router;
