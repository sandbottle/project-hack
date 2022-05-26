require('dotenv').config()

const koa = require('koa')
const session = require('koa-session')
const static = require('koa-static')
const body = require('koa-body')
const eta = require('eta')
const path = require('path')

const mongoose = require('mongoose')
const MongooseStore = require('koa-session-mongoose')
const gamehelper = require('./engine/gamefunctions')

// https server
/*
const http = require('http')
const https = require('https')
const greenlock = require('greenlock-koa').create({
    version: 'draft-11',
    // You MUST change this to 'https://acme-v02.api.letsencrypt.org/directory' in production
    server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
    email: 'manu@sandbottle.net',
    agreeTos: true,
    approveDomains: ['103.186.0.107'],
   
    // Join the community to get notified of important updates
    // and help make greenlock better
    communityMember: true,
    configDir: require('os').homedir() + '/acme/etc'
})

function approveDomains(opts, certs, cb) {
    if (certs) {
      opts.domains = certs.altnames
    } else {
        opts.email = 'manu@sandbottle.net'
        opts.agreeTos = true
    }
    opts.communityMember = true 
    cb(null, { options: opts, certs: certs })
}
*/

// db
mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true})
global.store = new MongooseStore()

// eta
eta.configure({
    views: path.join(__dirname, 'views')
})

// app
const app = new koa({keys: ['huuu']})
const sessConfig = {
    key: 'koa.sess', /** (string) cookie key (default is koa.sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    autoCommit: true, /** (boolean) automatically commit headers (default true) */
    overwrite: true, /** (boolean) can overwrite or not (default true) */
    httpOnly: true, /** (boolean) httpOnly or not (default true) */
    signed: true, /** (boolean) signed or not (default true) */
    rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
    secure: false, /** (boolean) secure cookie*/
    sameSite: null, /** (string) session cookie sameSite options (default null, don't set it) */
    store: store
} 

app.use(session(sessConfig, app))
app.use(body())

// websocket servers
global.mainServer = require('./engine/mainserver')
global.battleServer = require('./engine/battleserver')

// routes
app.use(require('./routes/main').routes()) 
app.use(require('./routes/applications').routes()) 

// statics
app.use(static(path.join(__dirname, 'static')))
app.use(static(path.join(__dirname, 'errors')))

// const server = https.createServer(greenlock.tlsOptions, greenlock.middleware(app.callback()))
app.listen(process.env.PORT, function() {
    var h = new gamehelper()
    h.cleanup()
    console.log('Server started.')
})

/*
var redirectHttps = app.use(require('koa-sslify')()).callback()
http.createServer(greenlock.middleware(redirectHttps)).listen(80, function () {
    console.log('Listening on port 80 to handle ACME http-01 challenge and redirect to https')
})
*/