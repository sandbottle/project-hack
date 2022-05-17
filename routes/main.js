const router = require('koa-router')
const eta = require('eta')
const db = require('../db/schema')
const bcrypt = require('bcrypt')

// h.removeFiles('manu', {name: 'manu'})
// helper.updateCurrency('manu', 0)

const r = router()

r.get('/', async function(ctx) {
    if (ctx.session.user) {
        await db.user.findOne({username: ctx.session.user}, {installed: 1}).then(async function(data) {
            ctx.body = await eta.renderFile('main.html', {useTutorial: ctx.session.newUser || false, user: ctx.session.user, installed: data.installed})
        })
    } else {
        ctx.body = await eta.renderFile('index.html')
    }
})

r.get('/block', async function(ctx) {
    ctx.body = await eta.renderFile('block.html')
})

r.post('/account/login', async function(ctx) {
    var body = ctx.request.body

    if (body.username && body.password) {
        await db.user.findOne({username: body.username}, {username: 1, password: 1}).then(async function(data) {
            if (data) {
                await bcrypt.compare(body.password, data.password).then(async function(result) {
                    if (result) {
                        ctx.session.user = body.username
                        ctx.body = {status: 'success'}
                    } else {
                        ctx.body = {status: 'failed', message: 'Invalid username/password'}
                    }
                }) 
            } else {
                ctx.body = {status: 'failed', message: 'Invalid username/password'}
            }
        })
    }
})

r.post('/account/register', async function(ctx) {
    var body = ctx.request.body

    if (/^[a-zA-Z0-9_]*$/.test(body.username) && body.username.length >= 4 && body.password.length >= 8 && body.email.length > 0) {
        await db.user.findOne({username: body.username}, {username: 1}).then(async function(data) {
            if (!data) {
                await bcrypt.hash(body.password, 10).then(async function(hash) {
                    const newUser = new db.user({
                        username: body.username, 
                        password: hash, 
                        email: body.email,
                        createdAt: new Date()
                    })
    
                    await newUser.save().then(function () {
                        ctx.session.newUser = true
                        ctx.session.user = body.username
                        ctx.body = {status: 'success'}
                    })
                })
            } else {
                ctx.body = {status: 'failed', message: 'Username already used'}
            }
        }) 
    }
})

r.get('/account/logout', function(ctx) {
    delete ctx.session.user
    ctx.body = {status: 'success'}
})

module.exports = r