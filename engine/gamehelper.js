const db = require('../db/schema')

class helper {
    constructor() {

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
                    resolve({status: 'failed', message: 'NaN founded'})
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
                    resolve({status: 'failed', message: 'Storage too full'})
                }
            })
        })
    }

    async removeFiles(username, files, number) {
        await db.user.findOne({username: username}, {files: 1, diskUsage: 1, maxDisk: 1, inodes: 1, maxInodes: 1}).then(async function(result) {
            if (result.files[files.name]) {
                result.diskUsage -= result.files[files.name].size * number
                result.inodes -= number
                
                if (result.files[files.name].number <= number) {
                    delete result.files[files.name]
                } else {
                    result.files[files.name].number -= number
                }
    
                result.markModified('files')
                result.markModified('diskUsage')
                result.markModified('inodes')
                await result.save()
            }
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
                        resolve({status: 'failed', message: 'storage'})
                    }
                } else {
                    resolve({status: 'failed', message: 'invalid'})
                }
            })
        })
    }

    startAttack(target) {
        return new Promise(resolve => {
            db.user.find({username: target}, {underAttack: 1}).then(function(result) {    
                if (!result.underAttack) {
                    result.underAttack = true
                    result.markModified('underAttack')
                    result.save()

                    resolve({status: 'success', timeout: function(cb) {
                        setTimeout(() => {
                            result.underAttack = false
                            result.markModified('underAttack')
                            result.save()

                            cb()
                        }, 120000)
                    }})
                } else {
                    resolve({status: 'failed', message: 'invalid'})
                }
            })
        })
    }
    
    async stopAttack(target) {
        await db.user.updateOne({username: target}, {underAttack: false})
    }
}

module.exports = helper