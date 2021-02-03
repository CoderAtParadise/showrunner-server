const express = require("express");
const router = express.Router();
const eventhandler = require("../components/event");
const upgradeSSE = require("../components/upgradeSSE");

router.get("/cues", async (req, res) => {
  let targets = [];
  if (req.query.target) targets = req.query.target.split(",");
  upgradeSSE(res);
  eventhandler.on("cue", (target, message) => {
    if (targets.length === 0 || targets.has(target))
      res.write(
        `event: cue\ntarget: ${target}\ndata: ${JSON.stringify(message)}\n\n`
      );
  });
});

//cue/trigger?item=0,cue=1
router.get("/cue/trigger", (req, res, next) => {});

module.exports = router;
