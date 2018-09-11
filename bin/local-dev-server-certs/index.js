const fs = require('fs');
const path = require('path');

const key = fs.readFileSync(path.join(__dirname, 'example.com.key.pem'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, 'example.com.crt.pem'), 'utf8');
const ca = fs.readFileSync(path.join(__dirname, 'example.com.ca.crt.pem'), 'utf8');

module.exports = {
  ca,
  cert,
  key,
};
