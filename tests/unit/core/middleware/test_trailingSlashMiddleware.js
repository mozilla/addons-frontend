import { trailingSlashesMiddleware } from 'core/middleware';

describe('Trailing Slashes Middleware', () => {
  let fakeRes;
  let fakeNext;
  let fakeConfig;

  beforeEach(() => {
    fakeNext = sinon.stub();
    fakeRes = {
      locals: {},
      redirect: sinon.stub(),
      set: sinon.stub(),
    };
    fakeConfig = new Map();
    fakeConfig.set('enableTrailingSlashesMiddleware', true);
    fakeConfig.set('validClientApplications', ['firefox']);
    fakeConfig.set('validTrailingSlashUrlExceptions', [
      '/$lang/lack/trailing',
      '/$clientApp/none/trailing',
      '/$lang/$clientApp/slash/trailing',
      '/no/trailing',
    ]);
  });

  it('should call next and do nothing with a valid, trailing slash URL', () => {
    const fakeReq = {
      originalUrl: '/foo/bar/',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeNext.called).toBeTruthy();
  });

  it('should add trailing slashes to a URL if one is not found', () => {
    const fakeReq = {
      originalUrl: '/foo/bar',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/foo/bar/']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('should not add trailing slashes if the URL has an exception', () => {
    const fakeReq = {
      originalUrl: '/no/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.called).toBeFalsy();
    expect(fakeNext.called).toBeTruthy();
  });

  it('should handle trailing slash exceptions with $lang', () => {
    const fakeReq = {
      originalUrl: '/en-US/lack/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.called).toBeFalsy();
    expect(fakeNext.called).toBeTruthy();
  });

  it('should handle trailing slash exceptions with $clientApp', () => {
    const fakeReq = {
      originalUrl: '/firefox/none/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.called).toBeFalsy();
    expect(fakeNext.called).toBeTruthy();
  });

  it('should handle trailing slash exceptions with $lang/$clientApp', () => {
    const fakeReq = {
      originalUrl: '/fr/firefox/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.called).toBeFalsy();
    expect(fakeNext.called).toBeTruthy();
  });

  it('should not be an exception without $lang/$clientApp', () => {
    const fakeReq = {
      originalUrl: '/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/slash/trailing/']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('should not be an exception without both $lang/$clientApp', () => {
    const fakeReq = {
      originalUrl: '/en-US/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/en-US/slash/trailing/']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('redirects a URL with $lang and $clientApp without an exception', () => {
    const fakeReq = {
      originalUrl: '/en-US/firefox/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/en-US/firefox/trailing/']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('detects an exception that has a query string', () => {
    const fakeReq = {
      originalUrl: '/no/trailing?query=test',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.called).toBeFalsy();
    expect(fakeNext.called).toBeTruthy();
  });

  it('does not remove query string', () => {
    const fakeReq = {
      originalUrl: '/hello?query=test',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/hello/?query=test']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('should not be an exception with missing $lang', () => {
    const fakeReq = {
      originalUrl: '/firefox/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/firefox/slash/trailing/']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('should include query params in the redirect', () => {
    const fakeReq = {
      originalUrl: '/foo/search?q=foo&category=bar',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/foo/search/?q=foo&category=bar']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('should handle several ? in URL (though that should never happen)', () => {
    const fakeReq = {
      originalUrl: '/foo/search?q=foo&category=bar?test=bad',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([301, '/foo/search/?q=foo&category=bar?test=bad']);
    expect(fakeNext.called).toBeFalsy();
  });
});
