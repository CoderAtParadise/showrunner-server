const express = require('express');
const router = express.Router();

router.get('/',function(req,res,next)
{
    res.status(200).json({"hello": "world"});
    return;
});

router.get('/:campus',function(req,res,next) {
    res.status(200).json({"hello": "world"});
    return;
});

router.get('/:campus/runsheet',function(req,res,next) {
   res.status(200).json({"hello": "world"});
   return;
});

module.exports = router;