import createStore, { middleware, minimalReduxLogger } from 'amo/store';
import { getFakeConfig } from 'tests/unit/helpers';
import { initialState } from 'amo/reducers/addons';

describe(__filename, () => {
  const configForDev = (isDevelopment, config = {}) => {
    return getFakeConfig({
      isDevelopment,
      server: false,
      ...config,
    });
  };

  it('includes logging middleware on the client while in development', () => {
    const _createLogger = sinon.stub();
    expect(
      typeof middleware({
        _config: configForDev(true),
        _createLogger,
      }),
    ).toBe('function');
    sinon.assert.called(_createLogger);
  });

  it('includes logging middleware on the server while in development', () => {
    const _applyMiddleware = sinon.stub();
    const _minimalReduxLogger = sinon.stub();

    expect(
      typeof middleware({
        _applyMiddleware,
        _config: configForDev(true, { server: true }),
        _minimalReduxLogger,
      }),
    ).toBe('function');

    sinon.assert.calledWith(
      _applyMiddleware,
      sinon.match((...args) => {
        return args.includes(_minimalReduxLogger);
      }),
    );
  });

  it('does not apply middleware if not in development', () => {
    const _createLogger = sinon.stub();
    expect(
      typeof middleware({
        _config: configForDev(false),
        _createLogger,
      }),
    ).toBe('function');
    sinon.assert.notCalled(_createLogger);
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
    sinon.assert.called(_createLogger);
  });

  it('does not create a logger for the server', () => {
    const _createLogger = sinon.stub();
    expect(
      typeof middleware({
        _config: configForDev(true, { server: true }),
        _createLogger,
      }),
    ).toBe('function');
    sinon.assert.notCalled(_createLogger);
  });

  it('uses a placeholder store enhancer when devtools is not available', () => {
    const _window = {}; // __REDUX_DEVTOOLS_EXTENSION__() is undefined
    const _config = getFakeConfig({ enableDevTools: true });

    const enhancer = middleware({ _config, _window });

    expect(typeof enhancer).toBe('function');

    const fakeCreatestore = () => {};
    expect(typeof enhancer(fakeCreatestore)).toBe('function');
  });

  it('adds the devtools store enhancer when config enables it', () => {
    const _window = {
      __REDUX_DEVTOOLS_EXTENSION__: sinon.spy(),
    };
    const _config = getFakeConfig({ enableDevTools: true });

    expect(typeof middleware({ _config, _window })).toBe('function');
    sinon.assert.called(_window.__REDUX_DEVTOOLS_EXTENSION__);
  });

  it('does not add the devtools store enhancer when config disables it', () => {
    const _window = {
      __REDUX_DEVTOOLS_EXTENSION__: sinon.spy(),
    };
    const _config = getFakeConfig({ enableDevTools: false });

    expect(typeof middleware({ _config, _window })).toBe('function');
    sinon.assert.notCalled(_window.__REDUX_DEVTOOLS_EXTENSION__);
  });

  describe('minimalReduxLogger', () => {
    it('process an action', () => {
      const action = sinon.stub();
      const reducerResult = { someState: 'yes' };
      const next = sinon.stub().returns(reducerResult);
      const store = sinon.stub();

      const handleNext = minimalReduxLogger(store);
      const handleAction = handleNext(next);
      const result = handleAction(action);

      sinon.assert.calledWith(next, action);
      expect(result).toEqual(reducerResult);
    });
  });

  it('creates an empty store', () => {
    const { store } = createStore();
    expect(store.getState().addons).toEqual(initialState);
  });
});
