import { assert } from 'chai';
import requireUncached from 'require-uncached';

const deployedEnvs = [
  'dev',
  'production',
  'stage',
];

const cdnHosts = {
  dev: 'https://addons-dev-cdn.allizom.org',
  stage: 'https://addons-stage-cdn.allizom.org',
  production: 'https://addons.cdn.mozilla.net',
};

const apiHosts = {
  dev: 'https://addons-dev.allizom.org',
  stage: 'https://addons.allizom.org',
  production: 'https://addons.mozilla.org',
};


describe('CSP Config', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'production';
  });

  for (const env of deployedEnvs) {
    it(`should have a source-list config for ${env}`, () => {
      process.env.NODE_ENV = env;
      const cdnHost = cdnHosts[env];
      const apiHost = apiHosts[env];
      const config = requireUncached('config');
      const cspConfig = config.get('CSP').directives;
      assert.include(cspConfig.scriptSrc, cdnHost);
      assert.include(cspConfig.scriptSrc, "'self'");
      assert.include(cspConfig.imgSrc, cdnHost);
      assert.include(cspConfig.imgSrc, "'self'");
      assert.include(cspConfig.styleSrc, cdnHost);
      assert.include(cspConfig.styleSrc, "'self'");
      assert.include(cspConfig.connectSrc, apiHost);
      assert.include(cspConfig.connectSrc, "'self'");
    });
  }

  it('should default default-src to "\'none\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.defaultSrc, ["'none'"]);
  });

  it('should default base-uri to "\'self\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.baseUri, ["'self'"]);
  });

  it('should default form-action to "\'self\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.formAction, ["'self'"]);
  });

  it('should default frame-ancestors to "\'none\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.frameAncestors, ["'none'"]);
  });

  it('should default frame-src to "\'none\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.frameSrc, ["'none'"]);
  });

  it('should default child-src to "\'none\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.childSrc, ["'none'"]);
  });

  it('should default object-src to "\'none\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.objectSrc, ["'none'"]);
  });

  it('should default media-src to "\'none\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.mediaSrc, ["'none'"]);
  });
});


describe('App Specific CSP Config', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.NODE_APP_INSTANCE;
  });

  it('should default frame-ancestors to "\'none\'"', () => {
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.frameAncestors, ["'none'"]);
  });

  it('should set frame-ancestors to about: to allow framing of disco pane', () => {
    process.env.NODE_APP_INSTANCE = 'disco';
    const config = requireUncached('config');
    const cspConfig = config.get('CSP').directives;
    assert.deepEqual(cspConfig.frameAncestors, ['about:']);
  });
});
