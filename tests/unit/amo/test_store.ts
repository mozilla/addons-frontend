import createStore, { includeDevTools, middleware, minimalReduxLogger } from 'amo/store';
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
    const logger = 'This is a logger';

    const _createLogger = jest.fn().mockReturnValue(logger);

    expect(middleware({
      _config: configForDev(true),
      _createLogger,
    })[0]).toEqual(logger);
    expect(_createLogger).toHaveBeenCalled();
  });
  it('includes logging middleware on the server while in development', () => {
    const _minimalReduxLogger = 'This is a logger';
    expect(middleware({
      _config: configForDev(true, {
        server: true,
      }),
      _minimalReduxLogger,
    })[0]).toEqual(_minimalReduxLogger);
  });
  it('does not apply middleware if not in development', () => {
    const _createLogger = jest.fn();

    expect(middleware({
      _config: configForDev(false),
      _createLogger,
    })).toHaveLength(0);
    expect(_createLogger).not.toHaveBeenCalled();
  });
  it('does not create a logger via createLogger for the server', () => {
    const _createLogger = jest.fn();

    expect(typeof middleware({
      _config: configForDev(true, {
        server: true,
      }),
      _createLogger,
    })[0]).toBe('function');
    expect(_createLogger).not.toHaveBeenCalled();
  });
  it('includes devtools when config enables it', () => {
    const _config = getFakeConfig({
      enableDevTools: true,
    });

    expect(includeDevTools({
      _config,
    })).toEqual(true);
  });
  it('does not include devtools when config disables it', () => {
    const _config = getFakeConfig({
      enableDevTools: false,
    });

    expect(includeDevTools({
      _config,
    })).toEqual(false);
  });
  describe('minimalReduxLogger', () => {
    it('process an action', () => {
      const action = jest.fn();
      const reducerResult = {
        someState: 'yes',
      };
      const next = jest.fn().mockReturnValue(reducerResult);
      const store = jest.fn();
      const handleNext = minimalReduxLogger(store);
      const handleAction = handleNext(next);
      const result = handleAction(action);
      expect(next).toHaveBeenCalledWith(action);
      expect(result).toEqual(reducerResult);
    });
  });
  it('creates an empty store', () => {
    const {
      store,
    } = createStore();
    expect(store.getState().addons).toEqual(initialState);
  });
});