// 195.101.252.193

function RoomsView(Model){
	var self = this;
	var myControlers = [];
	var myModel = Model;

	function displayRooms(allRooms){
		for(var i = 0, j = allRooms.length; i < j; i++){
			var tr = $('<tr></tr>').appendTo($('#roomTable'));
			$('<td></td>').appendTo(tr).text(allRooms[i].name.replace('_', ' '));
			$('<td></td>').appendTo(tr).text(allRooms[i].clientsNbr);
			$('<td></td>').appendTo(tr).html('<button class="joinRoom" data-name="' + allRooms[i].name + '">Join !</button>');
		}

		$('.joinRoom').on('click', function(){
			var roomName = $(this).attr('data-name');
			self.notify('joinRoom', {name: roomName});
		});
	}

	this.attach = function(controler){
		myControlers.push(controler);
	};

	this.notify = function(command, args){
		for(var i = 0, j = myControlers.length; i < j; i++){
			myControlers[i].receive(command, args);
		}
	};

	this.update = function(command){
		switch(command){
			case 'rooms':
				displayRooms(Model.getRooms());
			break;
		}
	};

	this.init = function(){
		$('#addRoom').on('click', function(){
			self.notify('joinRoom', {name: $('#newRoom').val()});
		});
		$('#newRoom').on('keypress', function(e){
			if(e.keyCode == 13){
				$('#addRoom').click();
			}
		});
		this.notify('init');
		this.notify('getRooms', {});
	};
}