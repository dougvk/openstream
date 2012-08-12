var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , parse = require('url').parse;

//--------------------------------------//
// Instantiate the API when the queue is ready to
// received messages
function create_api(exchange) {
    var api = express();

    // Set up sessions through our redis queue
    var RedisStore = require( 'connect-redis' )(express)
        , redisUrl =  parse(process.env.REDISTOGO_URL)
        , redisAuth = redisUrl.auth.split(':');
    api.set('redisHost', redisUrl.hostname)
    .set('redisPort', redisUrl.port)
    .set('redisDb', redisAuth[0])
    .set('redisPass', redisAuth[1]);

    api.configure(function(){
      api.use(express.logger('dev'));
      api.use(express.bodyParser());
      api.use(express.methodOverride());
      api.use(express.cookieParser(process.env.SECRET || "word"));

      // Configure our redis sessions
      api.use(express.session( {store: new RedisStore({
          host: api.get('redisHost'),
          port: api.get('redisPort'),
          db: api.get('redisDb'),
          pass: api.set('redisPass')
          })
      } ));

      api.use(api.router);

      // Set some api vars
      api.set('port', process.env.PORT || 3000);
      api.set('exchange', exchange);
      api.set('guid', guidGenerator);
    });

    api.configure('development', function(){
      api.use(express.errorHandler());
    });

    api.get('/', routes.index);

    io = require('socket.io').listen(http.createServer(api).listen(api.get('port'), function(){
      console.log("Express server listening on port " + api.get('port'));
    }));
}

//--------------------------------------//
// Job Queue
var amqp = require('amqp');

var url = process.env.CLOUDAMQP_URL
var conn = amqp.createConnection({url: url});

conn.on('ready', pub);

function pub() {
    var exchange = conn.exchange('celery', {durable: true, autoDelete: false, passive: false, type: 'direct'});
    var queue = conn.queue('celery', {durable: true, autoDelete: false, passive: false, exclusive: false}, function (queue) {
        console.log('Queue ' + queue.name + ' is open');
        create_api(exchange);
    });
}

function guidGenerator() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
