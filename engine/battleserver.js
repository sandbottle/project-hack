const ws = require('ws')
const cookie = require('cookie')
const parser = require('cookie-parser')
const vm2 = require('vm2')

rooms = {}

const wss = new ws.WebSocketServer({ port: 8081 })
wss.on('connection', async function connection(ws, req) {
    var cookies = cookie.parse(req.headers.cookie)
    var sid = parser.signedCookie(cookies['koa.sess'], 'huuu')
    
    await store.get(sid).then(function(data) {
        if (data.user && cookies.room) {
            ws.user = data.user
            ws.room = cookies.room

            if (rooms[ws.room]) {
                if (rooms[ws.room].bookedBy.includes(ws.user)) {
                    rooms[ws.room].clients.push(ws)

                    console.log(`player joined: ${ws.user}`)
                } else {
                    ws.send(JSON.stringify({status: 'failed', to: 'client', message: 'user_not_invited'}))
                    ws.close()  
                }
            } else {
                ws.send(JSON.stringify({status: 'failed', to: 'client', message: 'room_not_found'}))    
                ws.close()
            }
        } else {
            ws.send(JSON.stringify({status: 'failed', to: 'client', message: 'unauthorized'}))
            ws.close()
        }
    })

    // listeners
    ws.on('message', function(data) {
        var parsed = JSON.parse(data)

        switch (parsed.message) {
            case 'spawn':
                rooms[ws.room].entities.push(parsed.data.entityName)
                console.log(rooms[ws.room].entities)

                ws.send(JSON.stringify({status: 'success', message: 'spawned'}))
                break
        }
    })

    ws.on('close', function() {
        if (ws.user) {
            console.log(`player leave: ${ws.user}`)

            rooms[ws.room].clients.splice(rooms[ws.room].clients.indexOf(ws), 1)
            if (rooms[ws.room].clients.length == 0) {
                delete rooms[ws.room]
                console.log('room removed')
            }
        }
    })
})

module.exports = {
    create: function(room, bookedBy) {
        rooms[room] = {clients: [], bookedBy: bookedBy, entities: []}
    },
    destroy: function(room) {
        delete rooms[room]
    }
}