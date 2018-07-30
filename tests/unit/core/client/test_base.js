import createClient from 'core/client/base';

describe(__filename, () => {
  describe('createClient()', () => {
    let fakeCreateStore;
    let fakeFastClick;

    beforeEach(() => {
      fakeCreateStore = () => {
        return {
          sagaMiddleware: null,
          store: null,
        };
      };

      fakeFastClick = {
        attach: sinon.stub(),
      };
    });

    const _createClient = ({
      _FastClick = fakeFastClick,
      createStore = fakeCreateStore,
      ...others
    } = {}) => {
      return createClient(createStore, { _FastClick, ...others });
    };

    it('returns an object with a `renderApp` function', async () => {
      const props = await _createClient();

      expect(props).toHaveProperty('renderApp');
      expect(typeof props.renderApp).toEqual('function');
    });

    it('returns an object with a `history` object', async () => {
      const props = await _createClient();

      expect(props).toHaveProperty('history');
      expect(props.history).not.toBeNull();
    });

    it('returns an object with the created store', async () => {
      const store = sinon.stub();
      const createStore = () => {
        return {
          sagaMiddleware: null,
          store,
        };
      };

      const props = await _createClient({ createStore });
      expect(props).toHaveProperty('store', store);
    });
  });
});
