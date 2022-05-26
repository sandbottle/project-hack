const ws = require('ws')
const cookie = require('cookie')
const parser = require('cookie-parser')
const gamehelper = require('./gamefunctions')
const easystar = require('easystarjs')

var rooms = {}
var h = new gamehelper()
var tileList = {
    1: {name: 'empty', weight: 1},
    2: {name: 'wall', weight: 0},
    3: {name: 'port', weight: 1},
    4: {name: 'core', weight: 1}
}

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

                        // map rendering
                        room.pathfinding = new easystar.js()
                        room.pathfinding.setGrid(room.map)
                        room.pathfinding.setAcceptableTiles([0, 1, 2, 3, 4])

                        Object.keys(tileList).forEach(tile => {
                            console.log(tileList[tile].weight)
                            console.log(tile)
                            room.pathfinding.setTileCost(tile, tileList[tile].weight)
                        })

                        if (Object.keys(room.renderedMap).length == 0) {
                            room.map.forEach(function(column, y) {
                                column.forEach(function (row, x) {
                                    if (row > 1) {
                                        if (room.renderedMap[tileList[row].name]) {
                                            room.renderedMap[tileList[row].name].push({x, y})
                                        } else {
                                            room.renderedMap[tileList[row].name] = [{x, y}]
                                        }
                                    }
                                })
                            })
                        }
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

                h.spawn(ws.user, parsed.data.entityName).then(function(result) {
                    if (result.status == 'success') {
                        var portPos = room.renderedMap['port'][0]
                        room.pathfinding.findPath(portPos.x, portPos.y, 5, 5, function(path) {
                            console.log(path)
                            room.broadcast(JSON.stringify({status: 'success', message: 'spawned', data: {path: path}}))
                        })
                        room.pathfinding.calculate()
                    } else {
                        ws.send(JSON.stringify({status: 'failed', message: 'no_entity_to_spawn'}))
                    }
                })

                break
            }
    })

    ws.on('close', function() {
        var room = rooms[ws.room]

        if (ws.user) {
            console.log(`user ${ws.user} leaved`)

            if (room) {
                room.clients.splice(room.clients.indexOf(ws), 1)
                if (room.clients.length == 0) {
                    console.log('all user exited. deleting room ..')
                    delete room
                }
            }
        }
    })
})

module.exports = {
    create: function(room, bookedBy, map) {
        rooms[room] = {clients: [], bookedBy: bookedBy, map: map, renderedMap: {}, entities: []}
    },
    destroy: function(room) {
        if (rooms[room]) {
            rooms[room].broadcast(JSON.stringify({status: 'success', message: 'closed'}))
        }
        delete rooms[room]
    },
    rooms: rooms
}