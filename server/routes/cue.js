const express = require("express");
const router = express.Router();
const eventhandler = require("../components/event");

router.get("/cues", async (req, res) => {
  let targets = [];
  if (req.query.target) targets = req.query.target.split(",");
  //prettier-ignore
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive",
  });
  res.flushHeaders();
  eventhandler.on("cue", (target, message) => {
    if (targets.length === 0 || targets.has(target))
      res.write(
        `event: cue\ntarget: ${target}\ndata: ${JSON.stringify(message)}\n\n`
      );
  });
});

//cue/trigger?item=0,cue=1
router.get("/cue/trigger", (req, res, next) => {});

router.get("/prompt", (req, res) => {
  //prettier-ignore
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive",
  });
  res.flushHeaders();
  eventhandler.on("itemswitch", () => {
    //res.write(`event: item\ndata:${0}\n\n`);
  });
});

module.exports = router;
