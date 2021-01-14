const e = require('express');
const express = require('express');
const router = express.Router();
const auth = require('./auth');

function rebuild_cache(req,res,id)
{
    req.db.from('runsheets')
        .select('data');
}

router.get('/runsheet', (req,res,next) => {
    let id = req.query.id;
    if(Object.keys(req.query).length > 1 || !id)
    res.status(400)
        .json({error:true,mesage: "Invalid query parameter: only 'id' is permitted"});
    req.db.from('runsheets')
        .select('dirty','expires','cache')
        .where('id', id)
        .then(result => {
            if(!result || result.length === 0)
            {
                rebuild_cache(req,res,id);
            }
            else
            {
                res.map(runsheet => {
                    if(runsheet.is_dirty || Date.parse(runsheet.expires) < Date.now())
                        rebuild_cache(req,res);
                    else
                    res.status(200).json(runsheet.cache);
                });
            }
        });
});

router.get('/',function(req,res,next)
{
    req.db.from(`runsheets`)
        .select(`location`).distinct(`location`)
        .then(result => {
            if(!result || result.length === 0)
                res.status(400)
                    .json({error: true,message: "No locations exist in database"});
            else
                res.status(200).json(result);
        });
});

router.get('/:location/',function(req,res,next) {
    console.log("Help");
    req.db.from('runsheets')
    .select('location','show').distinct('show')
    .where('location','like',req.params.location)
    .then(result => {
        let error = false;
        if(!result || result.length == 0)
            error = true;
        if(error)
        res.status(404)
            .json({error: true,message:"No entry for location exists in database"});
        else
            res.status(200).json(result);
    });
});

router.get('/:location/:show/',auth.authorize,function (req,res,next) {
    req.db.from('runsheets')
        .select('id','location','show','from','to','title','subtitle')
        .where('location',req.params.location)
        .where('show',req.params.show)
        .then(result => {
            let error = false;
            if(!result || result.length == 0)
                error = true;
            if(error)
                res.status(404)
                .json({error: true,message: "No entry fro location and show exists in database"});
            else
                res.status(200).json(result);
        });
});

module.exports = router;