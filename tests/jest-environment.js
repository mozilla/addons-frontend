const { TextEncoder, TextDecoder } = require('util');

const JsdomEnvironment = require('jest-environment-jsdom');

class CustomEnvironment extends JsdomEnvironment {
  async setup() {
    await super.setup();
    // These are needed for Jest + jsdom v17.
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
    // These are needed for Jest + jsdom v17.
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = CustomEnvironment;
