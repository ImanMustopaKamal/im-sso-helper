const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

exports.rootDir = rootDir

exports.config = () => {
    try {
        
        let fileContents = fs.readFileSync(path.join(__dirname, '../configs' ,'config.yaml'), 'utf8')
        let data = yaml.safeLoad(fileContents)
        
        return data
    } catch (e) {
        console.log(e);
    }
}

function rootDir() {
    return path.join('..')
}