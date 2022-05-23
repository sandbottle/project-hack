function parse(content) {
    var lines = content.split('\n')
    var result = []
    var compilled = []

    lines.forEach(line => {
        if (line.trim().length > 0) {
            var tokenized = line.split(/(,|\.|'|"| |\(|\))/).filter(entry => entry.trim() != '')

            if ('(')
            switch (tokenized[0]) {
                case 'var':
                    result.push({type: 'variable_declaring', variableName: tokenized[1], variableValue: tokenized[4]})
                    break
            
                case 'if':
                case 'else':
                case 'elif':
                case 'when':
                    result.push({type: 'conditions', name: tokenized[0]})
                    break

                case 'use':
                    result.push({type: 'module', name: tokenized[1]})
                    break
                
                case 'repeat':
                    result.push({type: 'loop', conditions: tokenized[1]})
            
                default:
                    result.push({type: 'error', message: 'unknown'})
            }
        }
    })

    return result
}

function execute(content) {
    console.log(parse(content))
}

var code = `
use wordlist

wordlist.get('manu', 'password')
`

var client = `

`

parse(code)
execute(code)