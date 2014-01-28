exports.enableDebuging = true;
var allClients = {};
var self = exports;

var staticRooms = ['Main_room'];
var sessionSockets = null;
var io = null;
var allUsers = {};

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

exports.addMessage = function(message, room, pseudo){
    message.text = message.text.trim();
    if(message.text === '')
        return false;
    
    io.sockets.in(room).emit('message', {text: message.text, from: pseudo, room: room});
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

exports.login = function(usrPseudo, session){

    if(usrPseudo.length > 30){
        return 'MAX_LENGTH';
    }

    var found = false;
    for(userPseudo in allUsers){
        if(userPseudo == usrPseudo){
            found = true;
            break;
        }
    }

    if(found){
        return 'ALREADY_USED';
    }
    else{
        session.userName = usrPseudo;
        session.save();

        allUsers[usrPseudo] = {psd: usrPseudo, left: null, session: session, socket: null};
        return 'LOGGED';
    }
};

exports.setLeft = function(userName, time){
    var time = (time === null ? null : new Date().getTime());
    allUsers[userName].left = time;
};

exports.multiPing = function(users){
    for(var i = 0, j = users.length; i < j; i++){
        if(users[i].substr(0, 1) !== '@'){
            continue;
        }
        else if(typeof allUsers[users[i].substr(1)] === 'undefined'){
            continue;
        }
        var userName = users[i].substr(1);
        allUsers[userName].socket.emit('ping', new Date().getTime());
    }
};

exports.handlePong = function(firstPing, session){
    var time = new Date().getTime();
    var ping = (time - firstPing) / 2;
    self.addMessage({
        text: 'Ping of ' + session.userName + ' is : ' + ping + 'ms'
    }, session.room, 'Server');
};

exports.setSocket = function(session, socket){
    allUsers[session.userName].socket = socket;
    session.save();
};

function joinRoom(socket, session){
    socket.join(session.room);
    self.notifyRoom('connect', {roomName: session.room, psd: session.userName});
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