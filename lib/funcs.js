exports.enableDebuging = true;
var allClients = {};
var self = exports;

var staticRooms = ['Main_room'];
var sessionSockets = null;
var io = null;
var allUsers = {};
var adminPassword = 'Yoloswag2014';
var banndeIP = [];
const BAN_TIME = 3600;

exports.init = function(args){
    sessionSockets = args.sessionSockets;
    io = args.io;
};

exports.Debug = Debug = function(debugDatas){
    if(self.enableDebuging){
        var time = new Date();
        var logTime = '['+(time.getUTCHours() < 10 ? '0' : '')+time.getUTCHours()+'h'+(time.getUTCMinutes() < 10 ? '0' : '')+time.getUTCMinutes()+':'+(time.getUTCSeconds() < 10 ? '0' : '')+time.getUTCSeconds()+']';
        var logTimeColor = logTime.cyan;
        var debugColor = '[DEBUG] - '.red;

        if(typeof debugDatas === 'string'){
            var all = debugDatas.split('\n');
            for(var i = 0, j = all.length; i < j; i++){
                console.log(logTimeColor+debugColor+all[i]);
            }
        }
        else{
            console.log(logTimeColor+debugColor);
            console.log(debugDatas);
        }
    }
};

exports.getRooms = function(){

    var allRooms = [];

    for(var i = 0, j = staticRooms.length; i < j; i++){
        if(typeof io.sockets.manager.rooms['/' + staticRooms[i]] === 'undefined'){
            allRooms.push({
                name: staticRooms[i],
                clientsNbr: 0
            });
        }
    }

    for(var key in io.sockets.manager.rooms){
        if(key === "")
            continue;

        allRooms.push({
            name: key.replace('/', ''),
            clientsNbr: io.sockets.manager.rooms[key].length
        });
    }

    return allRooms;
};

exports.checkAuth = function(req){

    if(req.connection.remoteAddress === '195.101.252.193'){
        return '2';
    }
    else if(typeof req.session.userName !== 'undefined'){
        return '0';
    }
    else{
        return '1';
    }
};

exports.registerInRoom = function(roomInfos, socket, session){

    session.room = roomInfos.name;
    session.save();
    return true;
};

exports.reassignRooms = function(socket, session){
    var session = session || {};
    if(typeof session.room !== 'undefined' && session.inRoom === true){
        joinRoom(socket, session);
    }
};

exports.addMessage = function(message, session, pseudo){
    message.text = message.text.trim();
    if(typeof session === 'undefined'){
        session = {};
    }

    if(message.text === ''){
        return false;
    }
    else if(message.text.substr(0, 1) === '!' && typeof session.isAdmin !== 'undefined' && session.isAdmin === true){
        doAdminAction(message.text, session);
    }
    else if(message.text.substr(0, 7) === '!Iamgod' && (typeof session.isAdmin === 'undefined' || session.isAdmin === false)){
        logInAdmin(session, message.text);
    }
    else{
        if(checkUserSpam(session.room, pseudo)){
            io.sockets.in(session.room).emit('message', {text: message.text, from: pseudo, room: session.room});
        }
    }    
};

exports.getAllClients = function(room, callback){
    var ret = [];
    var nbrClients = io.sockets.clients(room).length;
    var i = 0;

    io.sockets.clients(room).forEach(function(socket){
        sessionSockets.getSession(socket, function(err, session){
            if(err) throw err;

            ret.push(session.userName);

            ++i;

            if(nbrClients <= i){
                callback(ret);
            }
        });
    });
};

exports.notifyRoom = function(command, args){

    switch(command){
        case 'connect':
            io.sockets.in(args.roomName).emit('connected', {userName: args.psd, from: 'Server', room: args.roomName});
        break;
        case 'leave':
            io.sockets.in(args.roomName).emit('leave', {userName: args.psd, from: 'Server', room: args.roomName});
        break;
    }
};

exports.returnClientRoom = function(session){
    return session.room;
};

exports.login = function(usrPseudo, session, ip){

    var regExp = new RegExp('((\\s+|\\W+)|(admin|server)+)', 'g');

    if(usrPseudo.length > 30){
        return 'MAX_LENGTH';
    }
    else if(usrPseudo.length < 1){
        return 'MIN_LENGTH';
    }
    else if(regExp.test(usrPseudo) === true){
        return 'INVALID_CHARS';
    }

    var found = false;
    var banned = false;

    for(userPseudo in allUsers){
        if(userPseudo == usrPseudo){
            found = true;
            break;
        }
    }

    for(var i = 0, j = banndeIP.length; i < j; i++){
        if(banndeIP[i].ip == ip){
            banned = true;
            break
        }
    }

    if(found){
        return 'ALREADY_USED';
    }
    else if(banned){
        return 'BANNED';
    }
    else{
        session.userName = usrPseudo;
        session.save();

        allUsers[usrPseudo] = {psd: usrPseudo, left: null, session: session, socket: null, isAdmin: false, spam: 0, lastMessageTime: 0};
        return 'LOGGED';
    }
};

exports.setLeft = function(userName, time){
    var time = (time === null ? null : new Date().getTime());
    allUsers[userName].left = time;
};

exports.multiPing = function(users, session){
    for(var i = 0, j = users.length; i < j; i++){
        if(users[i].substr(0, 1) !== '@'){
            continue;
        }
        else if(users[i] === '@'){
            self.pingAll(session);
            break;
        }
        else if(typeof allUsers[users[i].substr(1)] === 'undefined'){
            continue;
        }
        var userName = users[i].substr(1);
        allUsers[userName].socket.emit('ping', new Date().getTime());
    }
};

exports.pingAll = function(clientSession){
    io.sockets.clients(clientSession.room).forEach(function(socket){
        sessionSockets.getSession(socket, function(err, session){
            if(err) throw err;

            allUsers[session.userName].socket.emit('ping', new Date().getTime());
        });
    });
};

exports.handlePong = function(firstPing, session){
    var time = new Date().getTime();
    var ping = (time - firstPing) / 2;
    self.addMessage({
        text: 'Ping of @' + session.userName + ' is : ' + ping + 'ms'
    }, session.room, 'Server');
};

exports.setSocket = function(session, socket){
    allUsers[session.userName].socket = socket;
    session.save();
};

exports.kill = function(){
    io.sockets.emit('kill');
    process.exit(0);
};

exports.logoff = function(session){
    delete allUsers[session.userName];
    session.destroy();
};

function joinRoom(socket, session){
    socket.join(session.room);
    self.notifyRoom('connect', {roomName: session.room, psd: session.userName});
}

function logInAdmin(session, message){
    var psswd = message.substr(message.indexOf(' ')+1);
    if(psswd === adminPassword){
        session.isAdmin = true;
        session.save();
        io.sockets.socket(allUsers[session.userName].socket.id).emit('adminSet');
    }
}

function doAdminAction(command, session){
    var del = command.indexOf(' ');
    var realCommand = command.substr(0, (del > 0 ? del + 1 : command.length)).replace('!', '');
    var args = command.split(' ');
    args.splice(0, 1);

    switch(realCommand.trim()){
        case 'kick':
            kick(args, session);
        break;
        case 'ban':
            ban(args, session);
        break;
        case 'update':
            updateAll(args);
        break;
    }
}

function updateAll(time){
    var time = parseInt(time);
    if(isNaN(time)){
        time = 10;
    }
    io.sockets.emit('preUpdate', time);
    setTimeout(function(){
        io.sockets.emit('updateNow');
    }, time * 1000);
}

function kick(args, session){
    for(var i = 0, j = args.length; i < j; i++){
        var user = args[i];
        if(user.substr(0, 1) === '@'){
            var substred = user.substr(1);
            var thisUser = allUsers[substred];

            io.sockets.socket(thisUser.socket.id).emit('kicked', session.room);

            self.addMessage({
                text: '@' + substred + ' has been kicked from this channel'
            },
            session, 'Server');
            thisUser.socket.leave(session.room);
            thisUser.socket.disconnect();
        }
    }
}

function ban(args, session){
    for(var i = 0, j = args.length; i < j; i++){
        var user = args[i];
        if(user.substr(0, 1) === '@'){
            var substred = user.substr(1);
            var thisUser = allUsers[substred];

            io.sockets.socket(thisUser.socket.id).emit('banned', session.room);

            self.addMessage({
                text: '@' + substred + ' has been banned from this server'
            },
            session, 'Server');

            banndeIP.push({
                ip: thisUser.socket.handshake.address.address,
                time: new Date().getTime()
            });

            thisUser.socket.leave(session.room);
            thisUser.socket.disconnect();
            thisUser.session.destroy();
        }
    }
}

function checkUserSpam(room, pseudo){
    if(pseudo === 'Server'){
        return true;
    }
    var now = new Date().getTime();
    var ret;

    if(allUsers[pseudo].spam < 5 && allUsers[pseudo].lastMessageTime > now){
        ++allUsers[pseudo].spam;
        ret = true;
    }
    else if(allUsers[pseudo].spam >= 5){
        if(allUsers[pseudo].lastMessageTime < now){
            allUsers[pseudo].spam = 0;
            ret = true;
        }
        else{
            ret = false;
        }
    }
    else{
        ret = true;
    }

    allUsers[pseudo].lastMessageTime = new Date().getTime() + 500;
    return ret;
}

setInterval(function(){
    var date = new Date().getTime() - 30000;
    for(usrPseudo in allUsers){
        if(allUsers[usrPseudo].left !== null && allUsers[usrPseudo].left < date){
            allUsers[usrPseudo].session.destroy();
            delete allUsers[usrPseudo];
        }
    }
}, 20000);

setInterval(function(){
    var date = new Date().getTime() - (BAN_TIME * 1000);
    for(var i = 0, j = banndeIP.length; i < j; i++){
        if(banndeIP[i].time < date){
            banndeIP.splice(i, 1);
        }
    }
}, 60000);