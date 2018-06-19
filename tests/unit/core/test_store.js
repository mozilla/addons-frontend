import { middleware } from 'core/store';

describe('core store middleware', () => {
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

  it('uses a placeholder store enhancer when devtools is not installed', () => {
    const _window = {}; // devToolsExtension() is undefined
    const enhancer = middleware({
      _config: configForDev(true),
      _window,
    });
    expect(typeof enhancer).toBe('function');
    const createStore = () => {};
    expect(typeof enhancer(createStore)).toBe('function');
  });

  it('adds the devtools store enhancer in development', () => {
    const _window = {
      devToolsExtension: sinon.spy((createStore) => createStore),
    };
    expect(typeof middleware({ _config: configForDev(true), _window })).toBe(
      'function',
    );
    expect(_window.devToolsExtension.called).toEqual(true);
  });

  it('only adds the devtools store enhancer in development', () => {
    const _window = {
      devToolsExtension: sinon.spy((createStore) => createStore),
    };
    expect(typeof middleware({ _config: configForDev(false), _window })).toBe(
      'function',
    );
    expect(_window.devToolsExtension.called).toEqual(false);
  });
});
