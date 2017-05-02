import createLocalState, { configureLocalForage } from 'core/localState';
import { unexpectedSuccess } from 'tests/client/helpers';

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

describe('LocalState', () => {
  let store;

  before(() => {
    configureLocalForage();
  });

  beforeEach(() => {
    store = createLocalState('some-id');
    return store.localForage.clear();
  });

  afterEach(() => {
    return store.localForage.clear();
  });

  it('lets you get and set data', () => {
    const dataToStore = { name: 'Aristotle' };

    return store.setData(dataToStore)
      .then(() => store.getData())
      .then((storedData) => {
        assert.deepEqual(storedData, dataToStore);
      });
  });

  it('returns null when no data has been stored', () => {
    return store.getData()
      .then((data) => {
        assert.strictEqual(data, null);
      });
  });

  it('lets you remove data', () => {
    return store.setData({ name: 'Aristotle' })
      .then(() => store.removeData())
      .then(() => store.getData())
      .then((data) => {
        assert.strictEqual(data, null);
      });
  });

  it('can handle getData() errors', () => {
    const errStore = createLocalState('some-id', {
      localForage: fakeLocalForage({
        getItem: () => Promise.reject(new Error('some localForage error')),
      }),
    });
    return errStore.getData()
      .then(unexpectedSuccess, (error) => {
        assert.equal(error.message, 'some localForage error');
      });
  });

  it('can handle setData() errors', () => {
    const errStore = createLocalState('some-id', {
      localForage: fakeLocalForage({
        setItem: () => Promise.reject(new Error('some localForage error')),
      }),
    });
    return errStore.setData({})
      .then(unexpectedSuccess, (error) => {
        assert.equal(error.message, 'some localForage error');
      });
  });

  it('can handle removeData() errors', () => {
    const errStore = createLocalState('some-id', {
      localForage: fakeLocalForage({
        removeItem: () => Promise.reject(new Error('some localForage error')),
      }),
    });
    return errStore.removeData()
      .then(unexpectedSuccess, (error) => {
        assert.equal(error.message, 'some localForage error');
      });
  });

  it('requires you to store an object', () => {
    return store.setData(1)
      .then(unexpectedSuccess, (error) => {
        assert.match(error.message, /must be an object/);
      });
  });

  it('definitely does not let you store null', () => {
    return store.setData(null)
      .then(unexpectedSuccess, (error) => {
        assert.match(error.message, /must be an object/);
      });
  });

  it('lets you work with multiple stores', () => {
    const store1 = createLocalState('store1');
    const store2 = createLocalState('store2');
    return store1.setData({ number: 1 })
      .then(() => store2.setData({ number: 2 }))
      .then(() => store1.getData())
      .then((data) => {
        assert.deepEqual(data, { number: 1 });
      })
      .then(() => store2.getData())
      .then((data) => {
        assert.deepEqual(data, { number: 2 });
      });
  });
});
