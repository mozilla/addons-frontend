import { prefixMiddleware } from 'core/middleware';


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
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/firefox']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('should call res.redirect if handed a locale insted of a lang', () => {
    const fakeReq = {
      originalUrl: '/en_US/firefox',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/firefox']);
    expect(fakeNext.called).toBeFalsy();
  });

  it('should add an application when missing', () => {
    const fakeReq = {
      originalUrl: '/en-US/whatever/',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/firefox/whatever/']);
  });

  it('should prepend a lang when missing but leave a valid app intact', () => {
    const fakeReq = {
      originalUrl: '/firefox/whatever',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/firefox/whatever']);
    expect(fakeRes.set.firstCall.args).toEqual(['vary', []]);
  });

  it('should prepend lang when missing but keep clientAppUrlException', () => {
    const fakeReq = {
      originalUrl: '/validprefix/whatever',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/validprefix/whatever']);
    expect(fakeRes.set.firstCall.args).toEqual(['vary', []]);
  });

  it('should render 404 when a localeURL exception exists', () => {
    const fakeReq = {
      originalUrl: '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(statusSpy.firstCall.args).toEqual([404]);
  });

  it('should redirect a locale exception at the root', () => {
    const fakeReq = {
      originalUrl: '/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });

    expect(fakeRes.redirect.firstCall.args).toEqual([302,
      '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi']);
    expect(fakeRes.set.firstCall.args).toEqual(['vary', ['user-agent']]);
  });

  it('should redirect a locale exception nested in a valid locale', () => {
    const fakeReq = {
      originalUrl: '/en-US/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });

    expect(fakeRes.redirect.firstCall.args).toEqual([302,
      '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi']);
    expect(fakeRes.set.firstCall.args).toEqual(['vary', ['user-agent']]);
  });

  it('should render a 404 when a clientApp URL exception is found', () => {
    const fakeReq = {
      originalUrl: '/en-US/developers/theme/submit',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(statusSpy.firstCall.args).toEqual([404]);
  });

  it('should set lang when invalid, preserving clientApp URL exception', () => {
    const fakeReq = {
      originalUrl: '/en-USA/developers/',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/developers/']);
    expect(fakeRes.set.firstCall.args).toEqual(['vary', []]);
  });

  it('should render a 404 when a clientApp URL exception is found', () => {
    const fakeReq = {
      originalUrl: '/en-US/developers/',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(statusSpy.firstCall.args).toEqual([404]);
  });

  it('should fallback to and vary on accept-language headers', () => {
    const fakeReq = {
      originalUrl: '/firefox/whatever',
      headers: {
        'accept-language': 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2',
      },
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/pt-BR/firefox/whatever']);
    expect(fakeRes.set.firstCall.args[1]).toEqual(['accept-language']);
  });

  it('should map aliased langs', () => {
    const fakeReq = {
      originalUrl: '/pt/firefox/whatever',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/pt-PT/firefox/whatever']);
  });

  it('should vary on accept-language and user-agent', () => {
    const fakeReq = {
      originalUrl: '/whatever',
      headers: {
        'accept-language': 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2',
      },
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/pt-BR/firefox/whatever']);
    expect(fakeRes.set.firstCall.args[1]).toEqual(['accept-language', 'user-agent']);
  });

  it('should find the app based on ua string', () => {
    const fakeReq = {
      originalUrl: '/en-US/whatever',
      headers: {
        'user-agent': 'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
      },
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/android/whatever']);
    expect(fakeRes.set.firstCall.args[1]).toEqual(['user-agent']);
  });

  it('should populate res.locals for a valid request', () => {
    const fakeReq = {
      originalUrl: '/en-US/firefox/',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.locals.lang).toEqual('en-US');
    expect(fakeRes.locals.clientApp).toEqual('firefox');
    expect(fakeRes.redirect.called).toBeFalsy();
  });

  it('should not populate res.locals for a redirection', () => {
    const fakeReq = {
      originalUrl: '/foo/bar',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.locals.lang).toEqual(undefined);
    expect(fakeRes.locals.clientApp).toEqual(undefined);
    expect(fakeRes.redirect.called).toBeTruthy();
  });

  it('should not mangle a query string for a redirect', () => {
    const fakeReq = {
      originalUrl: '/foo/bar?test=1&bar=2',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.redirect.firstCall.args).toEqual([302, '/en-US/firefox/foo/bar?test=1&bar=2']);
  });
});
