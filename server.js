const koa = require('koa')
const session = require('koa-session')
const static = require('koa-static')
const body = require('koa-body')
const eta = require('eta')
const path = require('path')

const mongoose = require('mongoose')
const MongooseStore = require('koa-session-mongoose')

// db
mongoose.connect('mongodb://localhost:27017/projecthack', {useNewUrlParser: true, useUnifiedTopology: true})
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

// websocket engine
require('./engine/ws')

// routes
app.use(require('./routes/main').routes()) 

// statics
app.use(static(path.join(__dirname, 'static')))

app.listen(4040)
