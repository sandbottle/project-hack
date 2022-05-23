class commandLine {
    constructor (prompt, output) {
        this.prompt = prompt
        this.output = output
        this.commands = {}
        this.bookedBy = null

        var t = this

        $(prompt).on('keypress', function(keyId) {
            if (keyId.which == 13) {
                t.write(`<span class = "green">></span> ${$(t.prompt).val()}`)

                if (t.bookedBy == null) {
                    var promptVal = $(t.prompt).val().split(' ')
                    var command = promptVal[0]
                    promptVal.shift()

                    if (t.commands[command]) {
                        t.commands[command](promptVal)
                    } else {
                        t.commands['default'](command)
                    }
                }

                t.prompt.val('')
            }
        })
    }

    write(message) {
        $(this.output).append(`<div class = "terminal-line">${message}</div>`)
        $(this.output).scrollTop($(this.output)[0].scrollHeight)
    }

    clear() {
        $(this.output).html('')
    }
}