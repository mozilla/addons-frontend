import { middleware } from 'core/store';

describe('core store middleware', () => {
  function configForDev(isDevelopment) {
    return {
      get(key) {
        return (key === 'isDevelopment') ? isDevelopment : false;
      },
    };
  }

  it('includes the middleware in development', () => {
    const _createLogger = sinon.stub();
    assert.isFunction(middleware({
      _config: configForDev(true), _createLogger,
    }));
    assert.equal(_createLogger.called, true);
  });

  it('does not apply middleware if not in development', () => {
    const _createLogger = sinon.stub();
    assert.isFunction(middleware({
      _config: configForDev(false), _createLogger,
    }));
    assert.equal(_createLogger.called, false);
  });

  it('handles a falsey window while on the server', () => {
    const _createLogger = sinon.stub();
    const _window = null;
    assert.isFunction(middleware({
      _config: configForDev(true), _createLogger, _window,
    }));
    assert.equal(_createLogger.called, true);
  });

  it('uses a placeholder store enhancer when devtools is not installed', () => {
    const _window = {}; // devToolsExtension() is undefined
    const enhancer = middleware({
      _config: configForDev(true), _window,
    });
    assert.isFunction(enhancer);
    const createStore = () => {};
    assert.isFunction(enhancer(createStore));
  });

  it('adds the devtools store enhancer in development', () => {
    const _window = {
      devToolsExtension: sinon.spy((createStore) => createStore),
    };
    assert.isFunction(middleware({ _config: configForDev(true), _window }));
    assert.equal(_window.devToolsExtension.called, true);
  });
});
