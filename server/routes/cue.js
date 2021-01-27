const express = require("express");
const router = express.Router();
const eventhandler = require("../components/event");

router.get("/cues", async (req, res) => {
  let targets = [];
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write("retry: 10000\n\n");
  eventhandler.on("cue", (target, message) => {
    if (targets.length === 0 || targets.has(target))
      res.write(
        `event: cue:\n target: ${target}\ndata:${JSON.stringify(message)}\n\n`
      );
  });
});

router.get("/cue/trigger", (req, res, next) => {});

module.exports = router;