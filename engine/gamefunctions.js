const db = require('../db/schema')

class helper {
    constructor() {

    }

    async cleanup() {
        await db.user.updateMany({}, {online: false, underAttack: false, isAttacking: false})
    }

    async updateCurrency(username, number) {
        await db.user.updateOne({username: username}, {$inc: { currency: number }})
    }

    addFiles(username, files, number = 1) {
        return new Promise(resolve => {
            db.user.findOne({username: username}, {files: 1, diskUsage: 1, maxDisk: 1, inodes: 1, maxInodes: 1}).then(function(result) {                
                if (!files.size && result.files[files.name]) {
                    files.size = result.files[files.name].size
                }

                if (files.size == NaN || number == NaN) {
                    resolve({status: 'failed', message: 'nan'})
                    return
                }
                
                if (result.diskUsage + (files.size * number) <= result.maxDisk && (result.inodes + number) <= result.maxInodes) {
                    result.diskUsage += files.size * number
                    result.inodes += number

                    if (!result.files[files.name]) {
                        result.files[files.name] = {size: files.size, contentLocation: files.contentLocation, number: number}
                    } else {
                        result.files[files.name].number += number
                    }
    
                    result.markModified('files')
                    result.markModified('diskUsage')
                    result.markModified('inodes')
                    result.save()
    
                    resolve({status: 'success'})
                } else {
                    resolve({status: 'failed', message: 'storage'})
                }
            })
        })
    }

    removeFiles(username, files, number) {
        return new Promise(resolve => {
            db.user.findOne({username: username}, {files: 1, diskUsage: 1, maxDisk: 1, inodes: 1, maxInodes: 1}).then(function(result) {
                if (result.files[files.name]) {
                    result.diskUsage -= result.files[files.name].size * number
                    result.inodes -= number
                    
                    var available = result.files[files.name].number

                    if (available == number) {
                        delete result.files[files.name]
                        resolve({status: 'success'})
                    } else if (available > number) {
                        result.files[files.name].number -= number
                        resolve({status: 'success'})
                    } else {
                        resolve({status: 'failed', message: 'file_not_found'})
                    }
        
                    result.markModified('files')
                    result.markModified('diskUsage')
                    result.markModified('inodes')
                    result.save()
                }
            })
        })
    }

    async listFiles(username) {
        await db.user.findOne({username: username}, {files: 1, _id: 0}).then(function(result) {
            console.log(result)
        })
    }

    async resetFiles(username) {
        await db.user.updateOne({username: username}, {$set: {inodes: 0, diskUsage: 0, files: []}})
    }

    createCloner(username, files, number) {
        return new Promise(resolve => {
            var t = this

            db.user.findOne({username: username}, {files: 1, diskUsage: 1, maxDisk: 1, inodes: 1, maxInodes: 1, installed: 1}).then(function(result) {
                var file = result.files[files.name]
                var clonerLevel = result.installed.cloner.settings.level
                var duration = file.size / (clonerLevel * 5)
                
                if (number <= clonerLevel * 10) {
                    if (result.diskUsage + (file.size * number) <= result.maxDisk && (result.inodes + number) <= result.maxInodes) {
                            resolve({status: 'success', cloner: function(cb) {
                                var index = 0
                                var needed = number
            
                                var interval = setInterval(() => {
                                    if (index <= needed - 1) {
                                        t.addFiles(username, {name: files.name, size: file.size}, 1).then(function(result) {
                                            if (result.status == 'failed') {
                                                cb()
                                                clearInterval(interval)
                                                return
                                            } else {
                                                index += 1
                                            }
                                        })
                                    } else {
                                        cb()
                                        clearInterval(interval)
                                        return
                                    }
                                }, (duration * 1000))
                            }, duration: duration})
                    } else {
                        resolve({status: 'failed', message: 'storage_too_full'})
                    }
                } else {
                    resolve({status: 'failed', message: 'invalid'})
                }
            })
        })
    }

    startAttack(username, target) {
        var t = this

        return new Promise(resolve => {
            db.user.findOne({username: target}, {map: 1, underAttack: 1, isAttacking: 1}).then(async function(result) {
                if (result) {
                    if (!result.underAttack && !result.isAttacking) {
                        var timeout = new Date().getTime() + 120000

                        result.underAttack = true
                        result.attackTimeout = timeout

                        result.markModified('underAttack')
                        result.markModified('attackTimeout')
                        result.save()
    
                        await db.user.updateOne({username: username}, {isAttacking: true, attackTimeout: timeout})

                        resolve({
                            status: 'success', 
                            timeout: function(cb) {
                                setTimeout(() => {
                                    t.stopAttack(username, target)
    
                                    cb()
                                }, 120000)
                            },
                            map: result.map
                        })
                    } else {
                        resolve({status: 'failed', message: 'under_attack'})
                    }
                } else {
                    resolve({status: 'failed', message: 'invalid'})
                }
            })
        })
    }
    
    async stopAttack(username, target) {
        await db.user.updateOne({username: target}, {underAttack: false, attackTimeout: null})
        await db.user.updateOne({username: username}, {isAttacking: false, attackTimeout: null})
    }

    scan(username, params) {
        return new Promise(resolve => {
            db.user.find({username: {$ne: username}, isAttacking: false, underAttack: false, online: true}, {username: 1, karma: 1, currency: 1, inodes: 1, _id: 0}).limit(5).then(function(result) {
                resolve({status: 'success', data: result})
            })
        })
    }

    spawn(username, name) {
        var t = this

        return new Promise(resolve => {
            db.user.findOne({username: username}, {files: 1}).then(function(result) {
                var file = result.files[name]
                if (file) {
                    resolve({status: 'success', location: file.contentLocation})

                    if (file.number > 1) {
                        file.number -= 1
                    } else {
                        delete result.files[name]
                    }

                    result.markModified('files')
                    result.save()
                } else {
                    resolve({status: 'failed', message: 'file_not_found'})
                }
            })
        })
    }

    async changeOnlineStatus(username, isOnline = true) {
        await db.user.updateOne({username: username}, {online: isOnline})
    }
}

module.exports = helper