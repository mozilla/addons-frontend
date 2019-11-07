const fs = require('fs');
const path = require('path');

const key = fs.readFileSync(path.join(__dirname, 'example.com-key.pem'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, 'example.com.pem'), 'utf8');

module.exports = { cert, key };
