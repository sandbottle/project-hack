const ws = require('ws')
const cookie = require('cookie')
const parser = require('cookie-parser')
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
                        var targetExists = false
                        
                        if (!ws.target) {
                            // change this line
                            if (parsed.data.target != ws.user) {
                                this.wss.clients.forEach(function (client) {
                                    if (client.user == parsed.data.target) {
                                        if (ws.attacker == null) {
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
        
                                                        ws.target = null
                                                        client.attacker = null
                                                    })
                                                } else {
                                                    ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: result.message}))
                                                }
                                            })
                                        } else {
                                            client.send(JSON.stringify({status: 'failed', to: 'client', message: 'attacked'}))
                                        }
        
                                        /*
        
                                        codes:
                                            underattack: attacked by someone 
                                            attackstarted: success attacking target
                                            timeout: attack is finisihed due the 2 minutes limit
                                            attacked: can't attack because attaker is attacked by someone
                                        */
        
                                        targetExists = true
                                    } 
                                })
        
                                if (!targetExists) {
                                    ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: 'not_online'}))
                                }
                            } else {
                                ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: 'cant_do_self_attack'}))
                            }
                        } else {
                            ws.send(JSON.stringify({status: 'failed', to: 'warhorn', message: 'already_attack'}))
                        }
                    } else if (parsed.message == 'stop_attack') {
                        if (ws.target) {
                            this.h.stopAttack(ws.user, ws.target.user)

                            ws.target.send(JSON.stringify({status: 'success', to: 'client', message: 'attack_stopped'}))
                            ws.send(JSON.stringify({status: 'success', to: 'warhorn', message: 'attack_stopped'}))
                        
                            ws.target.attacker = null
                            ws.target = null
                        } else {
                            ws.send(JSON.stringify({status: 'success', to: 'warhorn', message: 'no_target'}))
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
        await store.get(sid).then(function(data) {
            if (!data.user) {
                ws.send(JSON.stringify({status: 'failed', to: 'client', message: 'unauthorized'}))
                ws.close()
            } else {
                ws.user = data.user
                ws.sid = sid

                t.h.changeOnlineStatus(data.user, true)
            }
        })
    }
        
    broadcast(data) {
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: isBinary })
            }
        })
    } 
}

new wsServer()