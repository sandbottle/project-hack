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
            'file-manager': {name: 'File Manager', icon: '/images/file-manager.png', settings: {pinned: true}},
            'terminal': {name: 'Terminal', icon: '/images/terminal.png', settings: {pinned: true}},
            'text-editor': {name: 'Text Editor', icon: '/images/text-editor.png', settings: {pinned: true}},
            'cloner': {name: 'Cloner', icon: '/images/cloner.png', settings: {pinned: true, level: 1}},
            'browser': {name: 'Browser', icon: '/images/browser.png', settings: {pinned: true}},
            'marketplace': {name: 'Marketplace', icon: '/images/marketplace.png', settings: {pinned: false}},
            'chat': {name: 'Chat', icon: '/images/chat.png', settings: {pinned: false}}
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
    map: {
        type: Array,
        required: true,
        default: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,2,1,1,1,1,1,3,0,0,0,0],
            [0,0,0,0,0,2,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,2,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    }
})

var market = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true,
        default: true
    },
    price: {
        type: String,
        required: true,
        default: 1
    }
})

exports.user = new mongoose.model('user', user, 'user')
exports.market = new mongoose.model('market', market, 'market')