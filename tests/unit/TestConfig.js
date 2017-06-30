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
    expect(conf.get('serverHost')).toEqual('127.0.0.1');
    process.env.SERVER_HOST = '0.0.0.0';
    jest.resetModules();
    conf = require('config');
    expect(conf.get('serverHost')).toEqual('0.0.0.0');
  });

  it('should allow port overrides', () => {
    let conf = require('config');
    expect(parseInt(conf.get('serverPort'), 10)).toEqual(4000);
    process.env.SERVER_PORT = 5000;
    jest.resetModules();
    conf = require('config');
    expect(parseInt(conf.get('serverPort'), 10)).toEqual(5000);
  });
});
