import { prefixMiddleWare, trailingSlashesMiddleware } from 'core/middleware';


describe('Prefix Middleware', () => {
  let fakeRes;
  let fakeNext;
  let fakeConfig;

  beforeEach(() => {
    fakeNext = sinon.stub();
    fakeRes = {
      locals: {},
      redirect: sinon.stub(),
      set: sinon.stub(),
      status: () => ({ end: sinon.stub() }),
    };
    fakeConfig = new Map();
    fakeConfig.set('validClientApplications', ['firefox', 'android']);
    fakeConfig.set('validLocaleUrlExceptions', ['downloads']);
    fakeConfig.set(
      'validClientAppUrlExceptions', ['developers', 'validprefix']);
  });

  it('should call res.redirect if changing the case', () => {
    const fakeReq = {
      originalUrl: '/en-us/firefox',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/firefox']);
    assert.notOk(fakeNext.called);
  });

  it('should call res.redirect if handed a locale insted of a lang', () => {
    const fakeReq = {
      originalUrl: '/en_US/firefox',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/firefox']);
    assert.notOk(fakeNext.called);
  });

  it('should add an application when missing', () => {
    const fakeReq = {
      originalUrl: '/en-US/whatever/',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/firefox/whatever/']);
  });

  it('should prepend a lang when missing but leave a valid app intact', () => {
    const fakeReq = {
      originalUrl: '/firefox/whatever',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/firefox/whatever']);
    assert.deepEqual(fakeRes.set.firstCall.args, ['vary', []]);
  });

  it('should prepend lang when missing but keep clientAppUrlException', () => {
    const fakeReq = {
      originalUrl: '/validprefix/whatever',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/validprefix/whatever']);
    assert.deepEqual(fakeRes.set.firstCall.args, ['vary', []]);
  });

  it('should render 404 when a localeURL exception exists', () => {
    const fakeReq = {
      originalUrl: '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(statusSpy.firstCall.args, [404]);
  });

  it('should redirect a locale exception at the root', () => {
    const fakeReq = {
      originalUrl: '/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });

    assert.deepEqual(fakeRes.redirect.firstCall.args, [302,
      '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi']);
    assert.deepEqual(fakeRes.set.firstCall.args, ['vary', ['user-agent']]);
  });

  it('should redirect a locale exception nested in a valid locale', () => {
    const fakeReq = {
      originalUrl: '/en-US/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });

    assert.deepEqual(fakeRes.redirect.firstCall.args, [302,
      '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi']);
    assert.deepEqual(fakeRes.set.firstCall.args, ['vary', ['user-agent']]);
  });

  it('should render a 404 when a clientApp URL exception is found', () => {
    const fakeReq = {
      originalUrl: '/en-US/developers/theme/submit',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(statusSpy.firstCall.args, [404]);
  });

  it('should set lang when invalid, preserving clientApp URL exception', () => {
    const fakeReq = {
      originalUrl: '/en-USA/developers/',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/developers/']);
    assert.deepEqual(fakeRes.set.firstCall.args, ['vary', []]);
  });

  it('should render a 404 when a clientApp URL exception is found', () => {
    const fakeReq = {
      originalUrl: '/en-US/developers/',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(statusSpy.firstCall.args, [404]);
  });

  it('should fallback to and vary on accept-language headers', () => {
    const fakeReq = {
      originalUrl: '/firefox/whatever',
      headers: {
        'accept-language': 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2',
      },
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/pt-BR/firefox/whatever']);
    assert.sameMembers(fakeRes.set.firstCall.args[1], ['accept-language']);
  });

  it('should map aliased langs', () => {
    const fakeReq = {
      originalUrl: '/pt/firefox/whatever',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/pt-PT/firefox/whatever']);
  });

  it('should vary on accept-language and user-agent', () => {
    const fakeReq = {
      originalUrl: '/whatever',
      headers: {
        'accept-language': 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2',
      },
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/pt-BR/firefox/whatever']);
    assert.sameMembers(fakeRes.set.firstCall.args[1], ['accept-language', 'user-agent']);
  });

  it('should find the app based on ua string', () => {
    const fakeReq = {
      originalUrl: '/en-US/whatever',
      headers: {
        'user-agent': 'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
      },
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/android/whatever']);
    assert.sameMembers(fakeRes.set.firstCall.args[1], ['user-agent']);
  });

  it('should populate res.locals for a valid request', () => {
    const fakeReq = {
      originalUrl: '/en-US/firefox/',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.equal(fakeRes.locals.lang, 'en-US');
    assert.equal(fakeRes.locals.clientApp, 'firefox');
    assert.notOk(fakeRes.redirect.called);
  });

  it('should not populate res.locals for a redirection', () => {
    const fakeReq = {
      originalUrl: '/foo/bar',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.equal(fakeRes.locals.lang, undefined);
    assert.equal(fakeRes.locals.clientApp, undefined);
    assert.ok(fakeRes.redirect.called);
  });

  it('should not mangle a query string for a redirect', () => {
    const fakeReq = {
      originalUrl: '/foo/bar?test=1&bar=2',
      headers: {},
    };
    prefixMiddleWare(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [302, '/en-US/firefox/foo/bar?test=1&bar=2']);
  });
});

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
    assert.ok(fakeNext.called);
  });

  it('should add trailing slashes to a URL if one is not found', () => {
    const fakeReq = {
      originalUrl: '/foo/bar',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args, [301, '/foo/bar/']);
    assert.notOk(fakeNext.called);
  });

  it('should not add trailing slashes if the URL has an exception', () => {
    const fakeReq = {
      originalUrl: '/no/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.notOk(fakeRes.redirect.called);
    assert.ok(fakeNext.called);
  });

  it('should handle trailing slash exceptions with $lang', () => {
    const fakeReq = {
      originalUrl: '/en-US/lack/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.notOk(fakeRes.redirect.called);
    assert.ok(fakeNext.called);
  });

  it('should handle trailing slash exceptions with $clientApp', () => {
    const fakeReq = {
      originalUrl: '/firefox/none/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.notOk(fakeRes.redirect.called);
    assert.ok(fakeNext.called);
  });

  it('should handle trailing slash exceptions with $lang/$clientApp', () => {
    const fakeReq = {
      originalUrl: '/fr/firefox/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.notOk(fakeRes.redirect.called);
    assert.ok(fakeNext.called);
  });

  it('should not be an exception without $lang/$clientApp', () => {
    const fakeReq = {
      originalUrl: '/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args,
      [301, '/slash/trailing/']);
    assert.notOk(fakeNext.called);
  });

  it('should not be an exception without both $lang/$clientApp', () => {
    const fakeReq = {
      originalUrl: '/en-US/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args,
      [301, '/en-US/slash/trailing/']);
    assert.notOk(fakeNext.called);
  });

  it('redirects a URL with $lang and $clientApp without an exception', () => {
    const fakeReq = {
      originalUrl: '/en-US/firefox/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args,
      [301, '/en-US/firefox/trailing/']);
    assert.notOk(fakeNext.called);
  });

  it('detects an exception that has a query string', () => {
    const fakeReq = {
      originalUrl: '/no/trailing?query=test',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.notOk(fakeRes.redirect.called);
    assert.ok(fakeNext.called);
  });

  it('does not remove query string', () => {
    const fakeReq = {
      originalUrl: '/hello?query=test',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args,
      [301, '/hello/?query=test']);
    assert.notOk(fakeNext.called);
  });

  it('should not be an exception without both $lang/$clientApp', () => {
    const fakeReq = {
      originalUrl: '/firefox/slash/trailing',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args,
      [301, '/firefox/slash/trailing/']);
    assert.notOk(fakeNext.called);
  });

  it('should include query params in the redirect', () => {
    const fakeReq = {
      originalUrl: '/foo/search?q=foo&category=bar',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args,
      [301, '/foo/search/?q=foo&category=bar']);
    assert.notOk(fakeNext.called);
  });

  it('should handle several ? in URL (though that should never happen)', () => {
    const fakeReq = {
      originalUrl: '/foo/search?q=foo&category=bar?test=bad',
      headers: {},
    };
    trailingSlashesMiddleware(
      fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    assert.deepEqual(fakeRes.redirect.firstCall.args,
      [301, '/foo/search/?q=foo&category=bar?test=bad']);
    assert.notOk(fakeNext.called);
  });
});
