
/*
 * GET home page.
 */

var fs = require('fs');
var funcs = require('../lib/funcs');

exports.index = function(req, res){
    var auth = funcs.checkAuth(req);
    req.session.inRoom = false;
    req.session.save();
  	if(auth == '0'){
        res.redirect('rooms');
    }
    else if(auth == '1'){
        render('index.html', res);
    }
    else if(auth == '2'){
        res.redirect('http://no.pe/');
    }
};
exports.rooms = function(req, res){
    var auth = funcs.checkAuth(req);
    req.session.inRoom = false;
    req.session.save();
    if(auth == '0'){
        render('rooms.html', res);
    }
    else if(auth == '1'){
        res.redirect('index');
    }
    else if(auth == '2'){
        res.redirect('http://no.pe/');
    }
};
exports.chat = function(req, res){
    var auth = funcs.checkAuth(req);
	if(auth == '0'){
        var chatRoom = req.params.chatID;
        if(typeof chatRoom !== 'undefined' && chatRoom !== ''){
            req.session.room = chatRoom;
            req.session.inRoom = true;
            req.session.save();
        }
        render('chat.html', res);
    }
    else if(auth == '1'){
        res.redirect('index');
    }
    else if(auth == '2'){
        res.redirect('http://no.pe/');
    }
};
exports.reconnect = function(req, res){
    if(typeof req.session.inRoom !== 'undefined'){
        var message = 'connected';
    }
    else{
        var message = 'refresh';
    }
    res.writeHead(200, {'Content-Type': 'text/plain','Content-Length':message.length});
    res.write(message);
    res.end();
    
};
exports.logoff = function(req, res){
    funcs.logoff(req.session);
    res.redirect('/index');
};
function render(file, res, opt){
    var opt = opt || null;
    fs.readFile('./views/'+file, function(err, html){
        if(err){
            console.log('Error : '+err);
            return false;
        }
        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':html.length});
        res.write(html, opt);
        res.end();
    });
}