import { assert } from 'chai';
import requireUncached from 'require-uncached';

describe('Disco App Specific CSP Config', () => {
  let config;

  afterEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.NODE_APP_INSTANCE;
  });

  beforeEach(() => {
    process.env.NODE_APP_INSTANCE = 'disco';
    config = requireUncached('config');
  });

  it('should set style-src for disco', () => {
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.styleSrc, ['https://addons-discovery.cdn.mozilla.net']);
  });

  it('should set script-src for disco', () => {
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.scriptSrc, [
      'https://addons-discovery.cdn.mozilla.net', 'https://www.google-analytics.com']);
  });

  it('should set media-src for disco', () => {
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.mediaSrc, ['https://addons-discovery.cdn.mozilla.net']);
  });

  it('should set img-src for disco', () => {
    const cspConfig = config.get('CSP').directives;
    assert.sameMembers(cspConfig.imgSrc, [
      "'self'",
      'data:',
      'https://addons.cdn.mozilla.net',
      'https://addons-discovery.cdn.mozilla.net',
      'https://www.google-analytics.com',
    ]);
  });
});
