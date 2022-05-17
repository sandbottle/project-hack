const ws = require('ws')
const cookie = require('cookie')
const parser = require('cookie-parser')
const gamehelper = require('./gamehelper')

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
            ws.on('message', (data) => t.onmessage(data, ws))
            ws.on('close', () => t.onclose())
        })
    }

    onopen() {
        
    }

    async onmessage(data, ws) {
        var parsed = JSON.parse(data)
        
        if (parsed.status == 'success') {
            switch (parsed.from) {
                case 'client':
                    ws.send(JSON.stringify({status: 'success', to: 'client', message: 'ok'}))
                    break
                case 'cloner':
                    if (parsed.message == 'startclone') {
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
                    } else if (parsed.message == 'check') {
                        ws.send(JSON.stringify({status: 'success', to: 'cloner', message: '', isUsed: ws.clonedUsed || false}))
                    }
                    break
                case 'warhorn':
                    if (parsed.message == 'startattack') {
                        this.wss.clients.forEach(client => {
                            
                        })
    
                        break
                    }
            }
        } else {
            console.log(parsed.message)
        }
    }

    onclose() {
        console.log('disconnected')
    }

    async auth(ws, req) {
        var cookies = cookie.parse(req.headers.cookie)
        var sid = parser.signedCookie(cookies['koa.sess'], 'huuu')
        await store.get(sid).then(function(data) {
            if (!data.user) {
                ws.send(JSON.stringify({status: 'failed', to: 'client', message: 'unauthorized'}))
                ws.close()
            } else {
                ws.user = data.user
            }
        })
    }
        
    broadcast() {
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: isBinary })
            }
        })
    } 
}

new wsServer()