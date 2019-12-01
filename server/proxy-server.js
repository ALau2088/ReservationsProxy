const nr = require('newrelic');
const express = require('express');
const request = require('request');
const Redis = require('ioredis');
const responseTime = require('response-time');

const redis_address = 'redis://reservations-cache.cstdzt.0001.usw1.cache.amazonaws.com:6379'

const app = express();
const bodyParser = require('body-parser');

const port = 3000;

const redis = new Redis(redis_address);

redis.on('connect', function(err, connect) {
  if (err) {
    throw err;
  } else {
    console.log('connected to Redis')
  };
});

// Redis test
redis.set("foo", "bar");
redis.get("foo", (err, result) => {
  if (err) {
    throw err
  } else {		  
    console.log(result, "\nRedis test passed");
  }
});
redis.del("foo");

app.use('/loaderio-bdc0b94772a7c17050ee17ae0c6876d1', (req, res, next) => {
  res.send('loaderio-bdc0b94772a7c17050ee17ae0c6876d1')
})

app.use('/:id/', express.static('public'));

app.use(responseTime());

redis.del("1");

app.get('/api/:id/reservations', (req, res) => {
  const resObj = res;
  const id = req.params.id;
  console.log(req.params)
    //console.log('error:', error);
    //console.log('statusCode:', response && response.statusCode);
    //console.log('body:', body);
  redis.get(`${req.params.id}`, (err, result) => {
      if (err) {
        throw err;
      } else if (result) {
	console.log('result')
	console.log('result',result)
	const resultJSON = JSON.parse(result);
        res.send(resultJSON);
      } else {
        request.get(`http://ec2-54-183-151-251.us-west-1.compute.amazonaws.com:3013/api/${req.params.id}/reservations/`, function (error, response, body){
    	  if (error){
  	    throw error 
          } else {
	    console.log('not cached')
	    const resultJSONString = JSON.stringify(body);
	    redis.set(`${id}`, resultJSONString);
	    resObj.send(body);
          };
	});
      };
  });
});


app.listen(port, () => { console.log(`Proxy server listening on port ${port}`); });
