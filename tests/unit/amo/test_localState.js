import createLocalState, { configureLocalForage } from 'amo/localState';
import { unexpectedSuccess } from 'tests/unit/helpers';

function fakeLocalForage(overrides = {}) {
  return {
    clear: sinon.spy(() => {}),
    config: sinon.spy(() => {}),
    getItem: sinon.spy(() => Promise.resolve()),
    removeItem: sinon.spy(() => Promise.resolve()),
    setItem: sinon.spy(() => Promise.resolve()),
    ...overrides,
  };
}

describe(__filename, () => {
  let localState;

  beforeAll(() => {
    configureLocalForage();
  });

  beforeEach(() => {
    localState = createLocalState('some-id');
    return localState.localForage.clear();
  });

  afterEach(() => {
    return localState.localForage.clear();
  });

  it('configures storage', () => {
    const localForage = fakeLocalForage();
    configureLocalForage({ localForage });

    sinon.assert.calledWith(localForage.config, {
      name: sinon.match.string,
      version: sinon.match.string,
      storeName: 'src/amo/localState.js',
    });
  });

  it('lets you save and load data', () => {
    const state = { name: 'Aristotle' };

    return localState
      .save(state)
      .then(() => localState.load())
      .then((savedState) => {
        expect(savedState).toEqual(state);
      });
  });

  it('returns null when no data has been saved', () => {
    return localState.load().then((data) => {
      expect(data).toBe(null);
    });
  });

  it('lets you remove data', () => {
    return localState
      .save({ name: 'Aristotle' })
      .then(() => localState.clear())
      .then(() => localState.load())
      .then((data) => {
        expect(data).toBe(null);
      });
  });

  it('can handle load() errors', () => {
    const errStore = createLocalState('some-id', {
      localForage: fakeLocalForage({
        getItem: () => Promise.reject(new Error('some localForage error')),
      }),
    });
    return errStore.load().then(unexpectedSuccess, (error) => {
      expect(error.message).toEqual('some localForage error');
    });
  });

  it('can handle save() errors', () => {
    const errStore = createLocalState('some-id', {
      localForage: fakeLocalForage({
        setItem: () => Promise.reject(new Error('some localForage error')),
      }),
    });
    return errStore.save({}).then(unexpectedSuccess, (error) => {
      expect(error.message).toEqual('some localForage error');
    });
  });

  it('can handle clear() errors', () => {
    const errStore = createLocalState('some-id', {
      localForage: fakeLocalForage({
        removeItem: () => Promise.reject(new Error('some localForage error')),
      }),
    });
    return errStore.clear().then(unexpectedSuccess, (error) => {
      expect(error.message).toEqual('some localForage error');
    });
  });

  it('requires you to localState an object', () => {
    return localState.save(1).then(unexpectedSuccess, (error) => {
      expect(error.message).toMatch(/must be an object/);
    });
  });

  it('definitely does not let you save null', () => {
    return localState.save(null).then(unexpectedSuccess, (error) => {
      expect(error.message).toMatch(/must be an object/);
    });
  });

  it('lets you work with multiple instances', () => {
    const localState1 = createLocalState('one');
    const localState2 = createLocalState('two');
    return localState1
      .save({ number: 1 })
      .then(() => localState2.save({ number: 2 }))
      .then(() => localState1.load())
      .then((data) => {
        expect(data).toEqual({ number: 1 });
      })
      .then(() => localState2.load())
      .then((data) => {
        expect(data).toEqual({ number: 2 });
      });
  });
});
