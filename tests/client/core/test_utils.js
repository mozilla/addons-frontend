import {
  camelCaseProps,
  convertBoolean,
  getClientApp,
  getClientConfig,
  isValidClientApp,
} from 'core/utils';

describe('camelCaseProps', () => {
  const input = {
    underscore_delimited: 'underscore',
    'hyphen-delimited': 'hyphen',
    'period.delimited': 'period',
  };

  const result = camelCaseProps(input);

  it('deals with hyphenated props', () => {
    assert.equal(result.hyphenDelimited, 'hyphen');
  });

  it('deals with underscore delimited props', () => {
    assert.equal(result.underscoreDelimited, 'underscore');
  });

  it('deals with period delimited props', () => {
    assert.equal(result.periodDelimited, 'period');
  });
});


describe('getClientConfig', () => {
  const fakeConfig = new Map();
  fakeConfig.set('hai', 'there');
  fakeConfig.set('what', 'evar');
  fakeConfig.set('secret', 'sauce');
  fakeConfig.set('clientConfigKeys', ['hai', 'what']);

  it('should add config data to object', () => {
    const clientConfig = getClientConfig(fakeConfig);
    assert.equal(clientConfig.hai, 'there');
    assert.equal(clientConfig.what, 'evar');
    assert.equal(clientConfig.secret, undefined);
  });
});


describe('convertBoolean', () => {
  it('should see "false" as false', () => {
    assert.equal(convertBoolean('false'), false);
  });

  it('should see "0" as false', () => {
    assert.equal(convertBoolean('0'), false);
  });

  it('should see 0 as false', () => {
    assert.equal(convertBoolean(0), false);
  });

  it('should get "true" as true', () => {
    assert.equal(convertBoolean('true'), true);
  });

  it('should get "1" as true', () => {
    assert.equal(convertBoolean('1'), true);
  });

  it('should get 1 as true', () => {
    assert.equal(convertBoolean(1), true);
  });

  it('should return true for true value', () => {
    assert.equal(convertBoolean(true), true);
  });

  it('should return false for random string value', () => {
    assert.equal(convertBoolean('whatevs'), false);
  });
});


describe('getClientApplication', () => {
  it('should return firefox', () => {
    assert.equal(getClientApp(), 'firefox');
  });
});


describe('isValidClientApp', () => {
  const _config = new Map();
  _config.set('validClientApplications', ['firefox', 'android']);

  it('should be valid if passed "firefox"', () => {
    assert.equal(isValidClientApp('firefox', { _config }), true);
  });

  it('should be valid if passed "android"', () => {
    assert.equal(isValidClientApp('android', { _config }), true);
  });

  it('should be invalid if passed "whatever"', () => {
    assert.equal(isValidClientApp('whatever', { _config }), false);
  });
});
