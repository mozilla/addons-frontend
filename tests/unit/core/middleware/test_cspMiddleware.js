import fs from 'fs';

import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';
import parse from 'content-security-policy-parser';

import log from 'core/logger';
import { csp, getNoScriptStyles } from 'core/middleware';

describe('CSP Middleware', () => {
  const existingNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = existingNodeEnv;
    delete process.env.NODE_APP_INSTANCE;
  });

  it('provides the expected csp output for amo with noScriptStyles', () => {
    process.env.NODE_ENV = 'production';
    process.env.NODE_APP_INSTANCE = 'amo';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('config');
    const middleware = csp({
      _config: config,
      appName: 'amo',
      noScriptStyles: getNoScriptStyles('amo'),
    });
    const nextSpy = sinon.stub();
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    middleware(req, res, nextSpy);
    const cspHeader = res.get('content-security-policy');
    const policy = parse(cspHeader);
    const cdnHost = 'https://addons-amo.cdn.mozilla.net';
    expect(policy['default-src']).toEqual(["'none'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['frame-src']).toEqual(["'none'"]);
    expect(policy['media-src']).toEqual(["'none'"]);
    expect(policy['form-action']).toEqual(["'self'"]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['img-src']).toEqual(
      expect.arrayContaining([
        "'self'",
        'data:',
        cdnHost,
        'https://addons.cdn.mozilla.net',
        'https://www.google-analytics.com',
      ]),
    );
    expect(policy['script-src']).toEqual([
      cdnHost,
      'https://www.google-analytics.com/analytics.js',
    ]);
    expect(policy['script-src']).not.toContain("'self'");
    expect(policy['connect-src']).not.toContain("'self'");
    expect(policy['connect-src']).toEqual([
      'https://addons.mozilla.org',
      'https://sentry.prod.mozaws.net',
    ]);
    expect(policy['style-src']).toEqual([
      cdnHost,
      "'sha256-DiZjxuHvKi7pvUQCxCVyk1kAFJEUWe+jf6HWMI5agj4='",
    ]);
    expect(nextSpy.calledOnce).toEqual(true);
  });

  it('provides the expected style-src directive when noScriptStyles is false', () => {
    process.env.NODE_ENV = 'production';
    process.env.NODE_APP_INSTANCE = 'amo';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('config');
    const middleware = csp({
      _config: config,
      appName: 'amo',
      noScriptStyles: false,
    });
    const nextSpy = sinon.stub();
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    middleware(req, res, nextSpy);
    const cspHeader = res.get('content-security-policy');
    const policy = parse(cspHeader);
    const cdnHost = 'https://addons-amo.cdn.mozilla.net';
    expect(policy['style-src']).toEqual([cdnHost]);
    expect(nextSpy.calledOnce).toEqual(true);
  });

  it('provides the expected csp output for the disco app', () => {
    process.env.NODE_ENV = 'production';
    process.env.NODE_APP_INSTANCE = 'disco';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('config');
    const middleware = csp({
      _config: config,
      appName: 'amo',
      noScriptStyles: getNoScriptStyles('disco'),
    });
    const nextSpy = sinon.stub();
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    middleware(req, res, nextSpy);
    const cspHeader = res.get('content-security-policy');
    const policy = parse(cspHeader);
    const cdnHost = 'https://addons-discovery.cdn.mozilla.net';
    expect(policy['default-src']).toEqual(["'none'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['frame-src']).toEqual(["'none'"]);
    expect(policy['form-action']).toEqual(["'none'"]);
    expect(policy['img-src']).toEqual(
      expect.arrayContaining([
        "'self'",
        'data:',
        cdnHost,
        'https://addons.cdn.mozilla.net',
        'https://www.google-analytics.com',
      ]),
    );
    expect(policy['script-src']).toEqual([
      cdnHost,
      'https://www.google-analytics.com/analytics.js',
    ]);
    expect(policy['script-src']).not.toContain("'self'");
    expect(policy['connect-src']).not.toContain("'self'");
    expect(policy['connect-src']).toEqual([
      'https://addons.mozilla.org',
      'https://sentry.prod.mozaws.net',
    ]);
    expect(policy['style-src']).toEqual([
      cdnHost,
      "'sha256-DiZjxuHvKi7pvUQCxCVyk1kAFJEUWe+jf6HWMI5agj4='",
    ]);
    expect(policy['media-src']).toEqual([cdnHost]);
    expect(nextSpy.calledOnce).toEqual(true);
  });

  it('converts false string to false boolean', () => {
    // This is so we can have environment config vars (`CSP=false`) for
    // `better-npm-run` that allow us to disable CSP when using dev/stage
    // data on a local dev server.
    const warnStub = sinon.stub();
    const middleware = csp({
      _config: {
        get: sinon
          .stub()
          .withArgs('CSP')
          .returns('false'),
      },
      _log: {
        warn: warnStub,
      },
    });
    const nextSpy = sinon.stub();
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    middleware(req, res, nextSpy);
    expect(warnStub.calledWith('CSP has been disabled from the config')).toBe(
      true,
    );
    expect(nextSpy.calledOnce).toEqual(true);
  });

  it('logs if the csp config is false', () => {
    const warnStub = sinon.stub();
    const middleware = csp({
      _config: {
        get: sinon
          .stub()
          .withArgs('CSP')
          .returns(false),
      },
      _log: {
        warn: warnStub,
      },
    });
    const nextSpy = sinon.stub();
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    middleware(req, res, nextSpy);
    expect(warnStub.calledWith('CSP has been disabled from the config')).toBe(
      true,
    );
    expect(nextSpy.calledOnce).toEqual(true);
  });

  it('does not blow up if optional args missing', () => {
    csp();
  });
});

describe('noScriptStyles', () => {
  it('should log on ENOENT', () => {
    const logStub = sinon.stub(log, 'debug');
    sinon.stub(fs, 'readFileSync').throws({
      code: 'ENOENT',
      message: 'soz',
    });
    getNoScriptStyles('disco');
    sinon.assert.calledWithMatch(logStub, /noscript styles not found at/);
  });

  it('should log on unknown exception', () => {
    const logStub = sinon.stub(log, 'info');
    sinon.stub(fs, 'readFileSync').throws({
      code: 'WHATEVER',
      message: 'soz',
    });
    getNoScriptStyles('disco');
    sinon.assert.calledWithMatch(
      logStub,
      /noscript styles could not be parsed from/,
    );
  });
});
