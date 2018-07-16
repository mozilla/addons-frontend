import { middleware } from 'core/store';

describe(__filename, () => {
  function configForDev(isDevelopment, config = {}) {
    const finalConfig = { isDevelopment, ...config };

    return {
      get(key) {
        return finalConfig[key];
      },
    };
  }

  it('includes the middleware in development', () => {
    const _createLogger = sinon.stub();
    expect(
      typeof middleware({
        _config: configForDev(true),
        _createLogger,
      }),
    ).toBe('function');
    expect(_createLogger.called).toEqual(true);
  });

  it('does not apply middleware if not in development', () => {
    const _createLogger = sinon.stub();
    expect(
      typeof middleware({
        _config: configForDev(false),
        _createLogger,
      }),
    ).toBe('function');
    expect(_createLogger.called).toEqual(false);
  });

  it('handles a falsey window while on the server', () => {
    const _createLogger = sinon.stub();
    const _window = null;
    expect(
      typeof middleware({
        _config: configForDev(true),
        _createLogger,
        _window,
      }),
    ).toBe('function');
    expect(_createLogger.called).toEqual(true);
  });

  it('does not create a logger for the server', () => {
    const _createLogger = sinon.stub();
    expect(
      typeof middleware({
        _config: configForDev(true, { server: true }),
        _createLogger,
      }),
    ).toBe('function');
    expect(_createLogger.called).toEqual(false);
  });

  it('uses a placeholder store enhancer when devtools is not available', () => {
    const _window = {}; // __REDUX_DEVTOOLS_EXTENSION__() is undefined
    const enhancer = middleware({ _config: configForDev(true), _window });

    expect(typeof enhancer).toBe('function');

    const createStore = () => {};
    expect(typeof enhancer(createStore)).toBe('function');
  });

  it('adds the devtools store enhancer when config enables it', () => {
    const _window = {
      __REDUX_DEVTOOLS_EXTENSION__: sinon.spy(),
    };
    const _config = configForDev(true, { enableDevTools: true });

    expect(typeof middleware({ _config, _window })).toBe('function');
    sinon.assert.called(_window.__REDUX_DEVTOOLS_EXTENSION__);
  });

  it('does not add the devtools store enhancer when config disables it', () => {
    const _window = {
      __REDUX_DEVTOOLS_EXTENSION__: sinon.spy(),
    };
    const _config = configForDev(true, { enableDevTools: false });

    expect(typeof middleware({ _config, _window })).toBe('function');
    sinon.assert.notCalled(_window.__REDUX_DEVTOOLS_EXTENSION__);
  });
});
