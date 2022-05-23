const ws = require('ws')
const cookie = require('cookie')
const parser = require('cookie-parser')
const childPros = require('child_process')
const crypto = require('crypto')

var rooms = {}

const wss = new ws.WebSocketServer({ port: 8081 })
wss.on('connection', async function connection(ws, req) {
    var cookies = cookie.parse(req.headers.cookie)
    var sid = parser.signedCookie(cookies['koa.sess'], 'huuu')

    Object.prototype.broadcast = function (message) {
        this.clients.forEach(function (client) {
            client.send(message)
        })
    }
    
    await store.get(sid).then(function(data) {
        if (data.user && cookies.room) {
            ws.user = data.user
            ws.room = cookies.room

            var room = rooms[ws.room]

            if (room) {
                if (room.bookedBy[ws.user]) {
                    room.clients.push(ws)
                    ws.role = room.bookedBy[ws.user].role

                    console.log(`user ${ws.user} joined`)

                    if (room.clients.length == Object.keys(room.bookedBy).length) {
                        room.broadcast(JSON.stringify({status: 'success', message: 'entered', data: {map: room.map}}))
                        console.log('all user joined. starting match ..')
                    }
                } else {
                    ws.send(JSON.stringify({status: 'failed', message: 'user_not_invited'}))
                    ws.close()  
                }
            } else {
                ws.send(JSON.stringify({status: 'failed', message: 'room_not_found'}))    
                ws.close()
            }
        } else {
            ws.send(JSON.stringify({status: 'failed', message: 'unauthorized'}))
            ws.close()
        }
    })

    // listeners
    ws.on('message', function(data) {
        var parsed = JSON.parse(data)
        var room = rooms[ws.room]

        switch (parsed.message) {
            case 'spawn':
                room.entities.push(parsed.data.entityName)
                console.log(`user spawn ${parsed.data}`)

                ws.send(JSON.stringify({status: 'success', message: 'spawned'}))
                
                break
            }
    })

    ws.on('close', function() {
        var room = rooms[ws.room]

        if (ws.user) {
            console.log(`user ${ws.user} leaved`)

            room.clients.splice(room.clients.indexOf(ws), 1)
            if (room.clients.length == 0) {
                console.log('all user exited. deleting room ..')
                delete room
            }
        }
    })
})

module.exports = {
    create: function(room, bookedBy, map) {
        rooms[room] = {clients: [], bookedBy: bookedBy, map: map, entities: []}
    },
    destroy: function(room) {
        delete rooms[room]
    }
}