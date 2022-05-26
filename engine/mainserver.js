const ws = require('ws')
const cookie = require('cookie')
const parser = require('cookie-parser')
const db = require('../db/schema')
const gamehelper = require('./gamefunctions')
const crypto = require('crypto')

class wsServer {
    constructor () {
        var t = this
        this.h = new gamehelper()

        this.wss = new ws.WebSocketServer({ port: 8080 })
        this.wss.on('connection', function connection(ws, req) {
            // on connect

            t.onopen()
            t.auth(ws, req)
        
            // listeners
            ws.on('message', (data) => t.onmessage(ws, data, req))
            ws.on('close', () => t.onclose(ws))
        })
    }
    
    onopen() {
        
    }

    /*
        code binding

        0 = failed
        1 = success
        
    */

    async onmessage(ws, data, req) {
        var parsed = JSON.parse(data)
        
        if (parsed.status == 'success') {
            switch (parsed.from) {
                case 'client':
                    // ws.send(JSON.stringify({status: 'success', to: 'client', message: 'ok'}))
                    break
                case 'cloner':
                    if (parsed.message == 'start_clone') {
                        if (!ws.clonedUsed) {
                            ws.clonedUsed = true
                            await this.h.createCloner(ws.user, {name: parsed.data.file}, parseInt(parsed.data.number)).then(function(result) {
                                if (result.status == 'success') {
                                    result.cloner(function() {
                                        ws.send(JSON.stringify({status: 'success', to: 'cloner', message: 'finished'}))
                                    })
            
                                    ws.send(JSON.stringify({status: 'success', to: 'cloner', message: 'started', duration: result.duration}))
                                } else {
                                    ws.send(JSON.stringify({status: 'failed', to: 'cloner', message: result.message}))
                                }

                                ws.clonedUsed = false
                            })
                        } else {
                            ws.send(JSON.stringify({status: 'failed', to: 'cloner', message: 'used'}))
                        }
                    }
                    break
                case 'terminal':
                    if (parsed.message == 'scan') {
                        this.h.scan(ws.user).then(function(result) {
                            if (result.status == 'success') {
                                ws.send(JSON.stringify({status: 'success', to: 'terminal', message: 'scan_result', data: result.data}))
                            } else {
                                ws.send(JSON.stringify({status: 'failed', to: 'terminal', message: result.message}))
                            }
                        })
                    } else if (parsed.message == 'spawn') {
                        ws.attackServer.spawn(true, {abc})

                        if (ws.target) {
                            ws.target.send(JSON.stringify({status: 'success', to: 'client', message: 'attacked'}))
                        } else {
                            ws.send(JSON.stringify({status: 'failed', to: 'terminal', message: 'not_attacking'}))
                        }
                    }
                    break
                case 'warhorn':
                    if (parsed.message == 'start_attack') {      
                        var t = this
                        
                        if (!ws.target && !ws.attacker) {
                            if (parsed.data.target != ws.user) {
                                var client = Array.from(t.wss.clients).filter(function(data) {return data.user == parsed.data.target})[0]

                                if (client) {
                                    t.h.startAttack(ws.user, parsed.data.target).then(async function(result) {
                                        if (result.status == 'success') {
                                            var room = crypto.randomBytes(16).toString('hex')
                                            
                                            var bookedBy = {}
                                            bookedBy[ws.user] = {role: 'attacker'}
                                            bookedBy[client.user] = {role: 'defender'}
    
                                            battleServer.create(room, bookedBy, result.map)
    
                                            client.send(JSON.stringify({status: 'success', to: 'client', message: 'under_attack', data: {room: room}}))
                                            ws.send(JSON.stringify({status: 'success', to: 'warhorn', message: 'attack_started', data: {room: room}}))
    
                                            ws.target = client
                                            client.attacker = ws
    
                                            result.timeout(function() {
                                                ws.send(JSON.stringify({status: 'success', to: 'warhorn', message: 'attack_timeout'}))
                                                client.send(JSON.stringify({status: 'success', to: 'client', message: 'attack_stopped'}))

                                                // battleServer.destroy(room)

                                                ws.target = null
                                                client.attacker = null
                                            })
                                        } else {
                                            ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: result.message}))
                                        }
                                    })
                                } else {
                                    ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: 'not_online'}))
                                }
                            } else {
                                ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: 'cant_do_self_attack'}))
                            }
                        } else {
                            ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: 'already_attacking_or_attacked'}))
                        }
                    } else if (parsed.message == 'stop_attack') {
                        if (ws.target) {
                            this.h.stopAttack(ws.user, ws.target.user)

                            ws.target.send(JSON.stringify({status: 'success', to: 'client', message: 'attack_stopped'}))
                            ws.send(JSON.stringify({status: 'success', to: 'warhorn', message: 'attack_stopped'}))

                            ws.target.attacker = null
                            ws.target = null
                        } else {
                            ws.send(JSON.stringify({status: 'success', to: 'client', message: 'no_target'}))
                        }
                    }
                    break
            }
        } else {
            console.log(parsed.message)
        }
    }

    onclose(ws) {
        if (ws.user) {
            this.h.changeOnlineStatus(ws.user, false)
        }
    }

    async auth(ws, req) {
        var t = this
        
        var cookies = cookie.parse(req.headers.cookie)
        var sid = parser.signedCookie(cookies['koa.sess'], 'huuu')
        await store.get(sid).then(async function(data) {
            if (!data.user) {
                ws.send(JSON.stringify({status: 'failed', to: 'client', message: 'unauthorized'}))
                ws.close()
            } else {
                ws.user = data.user
                ws.sid = sid

                await db.user.findOne({username: ws.user}, {underAttack: 1, isAttacking: 1, attackTimeout: 1}).then(function(result) {
                    if (result.underAttack || result.isAttacking) {
                        var otherUser = battleServer.rooms[cookies.room].clients.filter(function(data) {return data.user != ws.user})[0]
                        if (otherUser) {
                            var otherUserWs = Array.from(t.wss.clients).filter(function(data) {return data.user == otherUser['user']})[0]

                            if (otherUser['role'] == 'attacker') {
                                ws.attacker = otherUserWs
                                otherUserWs.target = ws
                            } else {
                                ws.target = otherUserWs
                                otherUserWs.attacker = ws
                            }
    
                            ws.send(JSON.stringify({status: 'success', to: 'client', message: 'connected', data: {isUnderOrAttack: true, attackTimeout: result.attackTimeout}}))
                        }
                    }
                })

                t.h.changeOnlineStatus(data.user, true)
            }
        })
    }
}

new wsServer()