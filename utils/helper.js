const helper = {
    preventXss: function (html) {
        
        let result = String(html).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

        if (result === '' + html) return html
        else return result
    },
    generatePrefixId: function (prefix, lastId, position) {
        const IDreplacedPrefix = lastId.replace(prefix, '')
        const numberLastId = Number(IDreplacedPrefix)
        let prefixId = ''
        if (!isNaN(numberLastId)) {
            const number = numberLastId + position + 1
            const stringTemp = prefix + number
            const zeroes = '00000000'
            const pad = zeroes.substring(stringTemp.length)
            prefixId = prefix + pad + number
        } else {
            const number = position + 1
            const stringTemp = prefix + number
            const zeroes = '00000000'
            const pad = zeroes.substring(stringTemp.length)
            prefixId = prefix + pad + number
        }
        return prefixId
    }
}


module.exports = helper