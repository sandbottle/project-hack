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
        type: Array,
        required: true,
        default: [
            {name: 'File Manager', initial: 'file-manager', icon: '/images/file-manager.png', settings: []},
            {name: 'Terminal', initial: 'terminal', icon: '/images/terminal.png', settings: []},
            {name: 'Text Editor', initial: 'text-editor', icon: '/images/text-editor.png', settings: []}
        ]
    }
})

exports.user = new mongoose.model('user', user, 'user')