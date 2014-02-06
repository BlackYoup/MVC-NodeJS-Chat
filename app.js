
/**
 * Module dependencies.
 */

var express = require('express');
var connect = require('connect');
var routes = require('./routes/router');
var http = require('http');
var path = require('path');
var colors = require('colors');
var funcs = require('./lib/funcs');
var Debug = funcs.Debug;

var app = express();
var cookieSecret = 'mySecretThere';
var cookieParser = express.cookieParser(cookieSecret);
var sessionStore = new connect.middleware.session.MemoryStore();

var SERVER_PORT = 25000;

// all environments
app.set('port', process.env.PORT || SERVER_PORT);
app.set('views', path.join(__dirname, 'views'));
app.use(express.favicon());
app.use(express.logger('dev'));
//app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(cookieParser);
app.use(express.session({ store: sessionStore }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/index', routes.index);
app.get('/rooms', routes.rooms);
app.get('/chat/:chatID', routes.chat);
app.get('/chat', routes.rooms);
app.get('/reconnect', routes.reconnect);
app.get('/logoff', routes.logoff);

var webServer = http.createServer(app).listen(app.get('port'), function(){
  Debug('Express server listening on port ' + app.get('port'));
});

require('./lib/chatServer')({
    webServer: webServer,
    cookieParser: cookieParser,
    sessionStore: sessionStore
});

process.on('uncaughtException',function(err){
    console.log(err);
});

process.on('SIGINT', function () {
    funcs.kill();
});
