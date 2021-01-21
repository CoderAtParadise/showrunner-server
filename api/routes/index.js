var express = require('express');
const app = require('../app');
var router = express.Router();

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

router.ws('/',(ws,req) => {
  ws.on('message',(msg) =>  { ws.send(msg); });
});

router.ws('/echo', (ws, req) => {
  ws.on('message', (msg) => {
    ws.send(msg);
  });
});

router.ws('/hello/:world',(ws,req) => {
  ws.send('Working!');
  ws.on('message', (msg) => {
    console.log(msg); // eslint-disable-line no-console
  });
  console.log('socket hello', req.world); // eslint-disable-line no-console
});

module.exports = router;
