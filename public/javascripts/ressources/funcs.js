function surchargeSocketIO(socket){
    var leaving = false;
    $(window).bind('beforeunload', function(){
        leaving = true;
    });
    socket.on('disconnect', function(){
        if(leaving){
            return false;
        }
        userNotification({
            status: false,
            message: 'Server connection lost'
        });
    });

    socket.on('reconnecting', function(){
        userNotification({
            status: '#ed8a0a',
            message: 'I\'m trying to reconnect myself to server. Hold on ...'
        });
    });

    socket.on('reconnect', function(){
        var toRrefresh;

        $.ajax({
            type: 'GET',
            url: '/reconnect',
            datatype: 'text/plain',
            success: function(data){
                if(data === 'connected'){
                    toRrefresh = false;
                }
                else if(data === 'refresh'){
                    toRrefresh = true;
                }

                setTimeout(function(){

                    if(toRrefresh){
                        var message = 'Yeah !! I\'m connected, but I need to refresh !';
                    }
                    else{
                        var message = 'Yeah !! I\'m connected, You can continue what you were doing, enjoy !';
                    }

                    userNotification({
                        status: true,
                        message: message
                    });
                    if(toRrefresh){
                        refresh();
                    }
                }, 500);
            }
        });
    });

    socket.on('reconnect_failed', function(){
        userNotification({
            status: false,
            message: 'Reconnexion fails. Please check your Internet if it happens too much'
        });
    });

    socket.on('error', function(err){
        console.log('Error on socket : ' + err);
    });

    socket.on('kill', function(){
        userNotification({
            message: 'Server is shutting down (may be restarting). See you later !',
            status: false
        }, 20);
    });

    socket.on('preUpdate', function(time){
        userNotification({
            message: 'You have to refresh for needed modifications. This will automatically refresh in ' + time + 's',
            status: '#ed8a0a'
        });
    });

    socket.on('updateNow', function(){
        document.location.reload();
    });

    return socket;
}

jQuery.fn.center = function () 
{
    var parent = this.parent(),
    parentPositionSave = parent.css('position');

    parent.css("position","absolute");
    var t = parent.css("top");
    var l = parent.css("left");
    
    this.css("position","absolute");
    this.css("top", ((this.parent().height() - this.outerHeight()) / 2) + this.parent().scrollTop() + "px");
    this.css("left", ((this.parent().width() - this.outerWidth()) / 2) + this.parent().scrollLeft() + "px");
    parent.css('position', parentPositionSave);
    return this;
}
function createWindow()
{
    if($('#frontWindow').length > 0){
        return false;
    }
    deleteCreatedWindow = false;

    var bigDiv = $('<div></div>').appendTo($('body'))
    .css({
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.50)',
        position: 'fixed',
        top: '0px',
        right: '0px',
        zIndex: '15'
    })
    .attr({
        id: 'frontWindow',
        onClick: function(){
            setTimeout(function() {
                if(deleteCreatedWindow){
                    $('#frontWindow').remove();
                }
                deleteCreatedWindow = true;
            }, 50);
        }
    });
}
function userNotification(object, top){
    createWindow();
    notif = $('<div></div>');
    $('.notification').each(function(){
        var newTop = $(this).position().top + 40;
        $(this).animate({
            top: newTop
        });
    });

    var colorClass;

    if(object.status === true){
        colorClass = 'rgba(2,126,251,0.80)';
    }
    else if(object.status === false){
        colorClass = 'rgba(255,32,32,0.80)';
    }
    else{
        colorClass = object.status;
    }

    notif.css({
        backgroundColor: colorClass
    }).appendTo($('#frontWindow')).text(object.message);

    if(typeof top !== 'undefined'){
        var className = 'notificationTop';
        var top = top;
    }
    else{
        var className = 'notification';
        var top = ((notif.parent().height() - notif.outerHeight()) / 2) + notif.parent().scrollTop();
    }


    notif.attr('class', className).css({
        left: ((notif.parent().width() - notif.outerWidth()) / 2) + notif.parent().scrollLeft() + "px", 
        top: '0px',
        display: 'inline-Block'
    }).animate({
        top: top + "px"
    }, 'fast', 'swing', null);

    onOuttaClick($('#frontWindow'), function(){
        if(typeof object.onFrontWindowClick === 'function'){
            object.onFrontWindowClick();
            return false;
        }
        $('.notification, .notificationTop').animate({
            top: $('body').height()+'px',
        }, 'fast', 'swing', function(){
            $('#frontWindow').fadeOut(function(){
                $(this).remove();
            });
        });
    });
}
function onOuttaClick(div, callBack){
    $(document.body).on('click', function(){
        if (!div.has(this).length && div.length > 0) { // if the click was not within box
            callBack();
            $(document.body).off('click');
        }
    });
    $(document.body).on('keydown', function(e){
        if(e.keyCode === 13)
            $(document.body).click();
    });
}

function refresh(){
    var i = 3;
    var callback = function(){
        document.location.reload();
    }

    var interVal = setInterval(function(){
        if(i === 0){
            userNotification({
                message: 'refreshing now',
                status: true
            });
            clearInterval(interVal);
            callback();
        }
        else{
            userNotification({
                message: 'refresh in ' + i + ' seconds (click to refresh now)',
                status: true,
                onFrontWindowClick: callback
            });
            --i;
        }
    }, 1000);
}

function logout(){
    document.location = 'http://' + SERVER_ADDR + ':' + SERVER_PORT + '/logoff';
}

$(document).ready(function(){
    $('#logoff').on('click', function(){
        logout();
    });
});