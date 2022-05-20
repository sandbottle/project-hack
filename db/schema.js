const mongoose = require('mongoose')

var user = new mongoose.Schema({
    blacklisted: {
        type: Boolean,
        default: false,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    pfp: {
        type: String,
        default: '/images/users/default.png'
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        required: false
    },
    sns: {
        type: Array,
        required: true,
        default: []
    },
    createdAt: {
        type: Date,
        default: new Date(), // for preventing error
        required: true
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    currency: {
        type: Number,
        required: true,
        default: 0
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    }, 
    installed: {
        type: Object,
        required: true,
        default: {
            'file-manager': {name: 'File Manager', icon: '/images/file-manager.png', settings: {}},
            'terminal': {name: 'Terminal', icon: '/images/terminal.png', settings: {}},
            'text-editor': {name: 'Text Editor', icon: '/images/text-editor.png', settings: {}},
            'cloner': {name: 'Cloner', icon: '/images/cloner.png', settings: {level: 1}},
            'browser': {name: 'Browser', icon: '/images/browser.png', settings: {}}
        }
    },
    diskUsage: {
        type: Number,
        required: true,
        default: 0
    },
    maxDisk: {
        type: Number,
        required: true,
        default: 250
    },
    inodes: {
        type: Number,
        required: true,
        default: 0
    },
    maxInodes: {
        type: Number,
        required: true,
        default: 100
    },
    files: {
        type: Object, 
        required: true,
        default: {
            'scanner': {size: 10, contentLocation: '/test', number: 2},
            // 'the doom': {size: 75, contentLocation: '/doom', number: 1},
            'test': {size: 1, contentLocation: null, number: 1}
        }
    },
    cloner: {
        type: Array,
        required: true,
        default: []
    },
    underAttack: {
        type: Boolean,
        required: true,
        default: false
    },
    isAttacking: {
        type: Boolean,
        required: true,
        default: false
    },
    attackTimeout: {
        type: Date,
        default: null
    },
    online: {
        type: Boolean,
        required: true,
        default: false
    },
    karma: {
        type: Number,
        required: true,
        default: 0
    },
    systemDesign: {
        type: Array,
        required: true,
        default: [
            null, null, null,
            null, {type: 'filesystem'}, null,
            null, {type: 'filesystem'}, null
        ]
    }
})

exports.user = new mongoose.model('user', user, 'user')