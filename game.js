const uuidv4 = require('uuid/v4');
var http = require('http').createServer(app);
var app = require('express')();

module.exports = function(server){
    var rooms = [];

    var io = require('socket.io')(server,{
        transports:['websocket'],
    });
    io.on('connection',function(){
        console.log("Connection");
            //방만들기
        var createRoom = function(){
            var roomId = uuidv4();
            socket.join(roomId,function(){
                var room = {roomId : roomId}
                rooms.push(room);

                socket.emit('res_join',{roomId:roomId,playerId:socket.roomId })
            });
        }

        //빈방찾기
        var GetRoomIndex = function(){
            if(rooms.length > 0)
            {
                var randomIndex = Math.floor(Math.random() * rooms.length) + 1  //랜덤으로 0~ 방 길이

                for(randomIndex < rooms.length; randomIndex++;)
                {
                    //랜덤인덱스부터 방을찾기
                    if(rooms[randomIndex].clints.length < 2)
                    {
                        return randomIndex;
                    }
                    //들어갈방이없다면 0번방부터 다시찾기
                    else
                    {
                        for(var i =0; i < rooms.length; i++)
                        {
                            if(rooms[i].clints.length < 2)
                            {
                                return i;
                            }
                        }
                    }
                }
            }
            return -1;  //방을 못찾으면 -1을 반환
        }
        var roomIndex = GetRoomIndex();
        if(roomIndex > -1) // 빈자리가있는 방을확인
        {
            //빈자리가있는room에 clients 에  clientId 를 푸쉬
            socket.join(rooms[roomIndex].roomId,function(){
                var client = {clientId:socket.id}
                rooms[roomIndex].clients.push(client);
                
                socket.emit('res_join',{roomId:rooms[roomIndex].roomId,clientId:socket.id});
            });            
        }
        else createRoom();    //-1로반환받으면 방을만들기

        socket.on('res_play',function(data){  // 준비 상관없이 5초뒤에 실행하게만들기
            for(var i =0; i < rooms.length; i++)
            {
                if(rooms[i].clients.length == 2 )
                {
                    var first = Math.floor(Math.random() * 2); // 0~1 난수
                    if(first == 0 ) // 랜덤숫자가 0이나오면 첫번쨰배열플레이어 선
                    {
                    io.to(rooms[i].clients[0]).emit('res_play',{first:true})
                    io.to(rooms[i].clients[1]).emit('res_play',{first:false})
                    }
                    else if(first == 1) // 랜덤숫자가 1이나오면 두번째 배열플레이어 선 
                    {
                        io.to(rooms[i].clients[0]).emit('res_play',{first:false})
                        io.to(rooms[i].clients[1]).emit('res_play',{first:true})
                    }
                }
            }

            socket.on('req_select',function(data){ //선택한 마커의 인덱스를 클라에게 받아와서  전달
                if(!data) return;
                var index = data.index;
                var roomId = data.roomId;
                var clientId = data.clientId;

                if(index > -1 && roomId){
                    socket.to(roomId).emit('res_selected',{index:index},{clientId:clientId});
                }
            });

            socket.on('res_win',function(data){ //승리
                if(!data)return;
                var roomId = data.roomId;
                var index = data.index;
                var clients = data.room.clients;
                if(index > -1 && roomdId) //패배시
                {                    
                    socket.to(roomId).emit('res_lose',{index : index});
                    socket.to(roomId).emit('res_gameOver',{client:clients[0].client},{roomId:roomdId});
                    socket.to(roomId).emit('res_gameOver',{client:clients[1].client},{roomId:roomId}); 
                }        
            });
            socket.on('res_tie',function(data){ //무승부
                if(!data) return;
                var roomId = data.roomId;
                var index = data.index;
                if(index > -1 && roomId)
                {
                    socket.to(roomId).emit('res_tie',{index: index});             
                    socket.to(roomId).emit('res_gameOver',{client:clients[0].client},{roomId:roomdId});
                    socket.to(roomId).emit('res_gameOver',{client:clients[1].client},{roomId:roomId});       
                }
            });            
        });

        socket.on('disconnect',function(reason){
            console.log('DisConnect');

            var room = rooms.find(room => room.clients.find(client => client.clientId === socket.id));
            var clients = rooms.clients
            var client = clients.find(client => client.clientId === socket.id);
            clients.splice(clients.indexOf(client),1);
            socket.leave(room.roomId);

            if(!clients[0])
            {
                socket.to(roomId).emit('res_win',room.clints[0].clientId)
                
            }
            else if(!clients[1])
            {
                socket.to(roomId).emit('res_win',room.clints[1].clientId)
            }
            else if(clients.length == 0)
            {
                rooms.splice(rooms.indexOf(room),1);
            }
        })
    });   
}
http.listen(3000,function(){
    console.log('listening on * : 3000');
   });