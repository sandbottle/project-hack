const ws = require('ws')
const cookie = require('cookie')
const parser = require('cookie-parser')

class wsServer {
    constructor () {
        var t = this

        this.wss = new ws.WebSocketServer({ port: 8080 })
        this.wss.on('connection', function connection(ws, req) {
            // on connect
            t.onopen()
            t.auth(ws, req)
        
            // listeners
            ws.on('message', (data) => t.onmessage(data))
            ws.on('close', () => t.onclose())
        })
    }

    onopen() {
        console.log('connected!')
    }

    onmessage(data) {
        console.log(data.toString())
    }

    onclose() {
        console.log('disconnected')
    }

    async auth(ws, req) {
        var cookies = cookie.parse(req.headers.cookie)
        var sid = parser.signedCookie(cookies['koa.sess'], 'huuu')
        await store.get(sid).then(function(data) {
            if (!data.user) {
                ws.close()
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