/* eslint-disable global-require */

describe('Config Environment Variables', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.SERVER_HOST;
    delete process.env.SERVER_PORT;
  });

  it('should allow host overrides', () => {
    let conf = require('config');
    assert.equal(conf.get('serverHost'), '127.0.0.1', 'initial host is set');
    process.env.SERVER_HOST = '0.0.0.0';
    jest.resetModules();
    conf = require('config');
    assert.equal(conf.get('serverHost'), '0.0.0.0', 'host is overidden');
  });

  it('should allow port overrides', () => {
    let conf = require('config');
    assert.equal(conf.get('serverPort'), '4000', 'Initial port is set');
    process.env.SERVER_PORT = '5000';
    jest.resetModules();
    conf = require('config');
    assert.equal(conf.get('serverPort'), '5000', 'Port is overidden');
  });
});
