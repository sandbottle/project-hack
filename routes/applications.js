const router = require('koa-router')
const eta = require('eta')
const path = require('path')
const gamehelper = require('../engine/gamefunctions')
const db = require('../db/schema')

const r = router()

r.get('/applications/:name', async function(ctx) {
    if (ctx.session.user) {
        if (ctx.params.name) {
            var data = {}

            switch (ctx.params.name) {
                case 'file-manager':
                    await db.user.findOne({username: ctx.session.user}, {files: 1, diskUsage: 1, maxDisk: 1, inodes: 1, maxInodes: 1}).then(function(result) {
                        if (result) {
                            data = result
                        }
                    })
                    break
                case 'cloner':
                    await db.user.findOne({username: ctx.session.user}, {files: 1, diskUsage: 1, maxDisk: 1, inodes: 1, maxInodes: 1, installed: 1}).then(function(result) {
                        if (result) {
                            data = result
                            data.clonerLevel = result.installed.cloner.settings.level
                            delete data.installed
                        }
                    })
                    break
                default: 
                    break
            }

            try {
                content = await eta.renderFile(path.join(__dirname, '../applications/', `${ctx.params.name}.html`), data)
                ctx.body = {status: 'success', content: content}
            } catch (err) {
                console.log(err)
                ctx.body = {status: 'failed', message: 'App not exist'}
            }
        } else {
            ctx.body = {status: 'failed', message: 'Invalid app name'}
        }
    } else {
        ctx.status = 403
    }
})

module.exports = r