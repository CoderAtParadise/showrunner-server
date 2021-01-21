var express = require('express');
const { Timepoint } = require('../components/timer');
var router = express.Router();

router.ws('/timers',(ws,req) => {
    ws.send(JSON.stringify({clock: Timepoint.now()}));
});

module.exports = router;