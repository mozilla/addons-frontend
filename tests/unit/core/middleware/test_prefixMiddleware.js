import { prefixMiddleware } from 'core/middleware';

describe(__filename, () => {
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
      vary: sinon.stub(),
    };
    fakeConfig = new Map();
    fakeConfig.set('validClientApplications', ['firefox', 'android']);
    fakeConfig.set('validLocaleUrlExceptions', ['downloads']);
    fakeConfig.set('validClientAppUrlExceptions', [
      'about',
      'developers',
      'validprefix',
    ]);
    fakeConfig.set('clientAppRoutes', ['about']);
    fakeConfig.set('validTrailingSlashUrlExceptions', ['about']);
  });

  it('should call res.redirect if changing the case', () => {
    const fakeReq = {
      originalUrl: '/en-us/firefox',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/en-US/firefox');
    sinon.assert.notCalled(fakeNext);
  });

  it('should call res.redirect if handed a locale insted of a lang', () => {
    const fakeReq = {
      originalUrl: '/en_US/firefox',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/en-US/firefox');
    sinon.assert.notCalled(fakeNext);
  });

  it('should add an application when missing', () => {
    const fakeReq = {
      originalUrl: '/en-US/whatever/',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/en-US/firefox/whatever/');
  });

  it('should prepend a lang when missing but leave a valid app intact', () => {
    const fakeReq = {
      originalUrl: '/firefox/whatever',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/en-US/firefox/whatever');
    sinon.assert.notCalled(fakeRes.vary);
  });

  it('should prepend lang when missing but keep clientAppUrlException', () => {
    const fakeReq = {
      originalUrl: '/validprefix/whatever',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(
      fakeRes.redirect,
      301,
      '/en-US/validprefix/whatever',
    );
    sinon.assert.notCalled(fakeRes.vary);
  });

  it('should render 404 when a localeURL exception exists', () => {
    const fakeReq = {
      originalUrl: '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(statusSpy, 404);
  });

  it('should redirect a locale exception at the root', () => {
    const fakeReq = {
      originalUrl: '/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });

    sinon.assert.calledWith(
      fakeRes.redirect,
      301,
      '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
    );
    sinon.assert.calledWith(fakeRes.vary, 'user-agent');
  });

  it('should redirect a locale exception nested in a valid locale', () => {
    const fakeReq = {
      originalUrl: '/en-US/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });

    sinon.assert.calledWith(
      fakeRes.redirect,
      301,
      '/firefox/downloads/file/224748/my-addon-4.9.21-fx%2Bsm.xpi',
    );
    sinon.assert.calledWith(fakeRes.vary, 'user-agent');
  });

  it('should render a 404 when a clientApp URL exception is found', () => {
    const fakeReq = {
      originalUrl: '/en-US/developers/theme/submit',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(statusSpy, 404);
  });

  it('should set lang when invalid, preserving clientApp URL exception', () => {
    const fakeReq = {
      originalUrl: '/en-USA/developers/',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/en-US/developers/');
    sinon.assert.notCalled(fakeRes.vary);
  });

  it('should render a 404 with clientApp exception', () => {
    const fakeReq = {
      originalUrl: '/en-US/developers/',
      headers: {},
    };
    const statusSpy = sinon.spy(fakeRes, 'status');
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(statusSpy, 404);
  });

  it('should fallback to and vary on accept-language headers', () => {
    const fakeReq = {
      originalUrl: '/firefox/whatever',
      headers: {
        'accept-language': 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2',
      },
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/pt-BR/firefox/whatever');
    sinon.assert.calledWith(fakeRes.vary, 'accept-language');
  });

  it('should map aliased langs', () => {
    const fakeReq = {
      originalUrl: '/pt/firefox/whatever',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/pt-PT/firefox/whatever');
  });

  it('should vary on accept-language and user-agent', () => {
    const fakeReq = {
      originalUrl: '/whatever',
      headers: {
        'accept-language': 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2',
      },
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/pt-BR/firefox/whatever');
    sinon.assert.calledWith(fakeRes.vary, 'accept-language');
    sinon.assert.calledWith(fakeRes.vary, 'user-agent');
  });

  it('should find the app based on ua string', () => {
    const fakeReq = {
      originalUrl: '/en-US/whatever',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
      },
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(fakeRes.redirect, 301, '/en-US/android/whatever');
    sinon.assert.calledWith(fakeRes.vary, 'user-agent');
  });

  it('should populate res.locals for a valid request', () => {
    const fakeReq = {
      originalUrl: '/en-US/firefox/',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.locals.lang).toEqual('en-US');
    expect(fakeRes.locals.clientApp).toEqual('firefox');
    sinon.assert.notCalled(fakeRes.redirect);
  });

  it('should populate a valid client app for a non clientApp URL', () => {
    const fakeReq = {
      originalUrl: '/en-US/about',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.locals.lang).toEqual('en-US');
    expect(fakeRes.locals.clientApp).toEqual('firefox');
    sinon.assert.notCalled(fakeRes.redirect);
  });

  it('should not populate res.locals for a redirection', () => {
    const fakeReq = {
      originalUrl: '/foo/bar',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    expect(fakeRes.locals.lang).toEqual(undefined);
    expect(fakeRes.locals.clientApp).toEqual(undefined);
    sinon.assert.called(fakeRes.redirect);
  });

  it('should not mangle a query string for a redirect', () => {
    const fakeReq = {
      originalUrl: '/foo/bar?test=1&bar=2',
      headers: {},
    };
    prefixMiddleware(fakeReq, fakeRes, fakeNext, { _config: fakeConfig });
    sinon.assert.calledWith(
      fakeRes.redirect,
      301,
      '/en-US/firefox/foo/bar?test=1&bar=2',
    );
  });
});
