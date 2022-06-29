import { createBrowserHistory } from 'history';
import serialize from 'serialize-javascript';

import createAmoStore from 'amo/store';
import createClient from 'amo/client/base';
import { loadedPageIsAnonymous } from 'amo/reducers/site';
import { createFakeTracking } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('createClient()', () => {
    const _createClient = ({
      createStore = createAmoStore,
      ...others
    } = {}) => {
      return createClient(createStore, { ...others });
    };

    it('returns an object with a `renderApp` function', async () => {
      const props = await _createClient();

      expect(props).toHaveProperty('renderApp');
      expect(typeof props.renderApp).toEqual('function');
    });

    it('returns an object with a `connectedHistory` object', async () => {
      const props = await _createClient();

      expect(props).toHaveProperty('connectedHistory');
      expect(props.connectedHistory).not.toBeNull();
    });

    it('returns an object with the created store', async () => {
      const storeResult = createAmoStore();
      const createStore = () => storeResult;

      const props = await _createClient({ createStore });
      expect(props).toHaveProperty('store', storeResult.store);
    });

    it('updates the tracking page on location change', async () => {
      const _tracking = createFakeTracking();
      const { connectedHistory } = await _createClient({ _tracking });
      const pathname = '/foo';

      connectedHistory.push({ pathname });

      expect(_tracking.setPage).toHaveBeenCalledWith(pathname);
      expect(_tracking.pageView).toHaveBeenCalledWith({ title: '' });
    });

    it('creates a browser history', async () => {
      const _createBrowserHistory = sinon.spy(createBrowserHistory);

      await _createClient({ _createBrowserHistory });

      sinon.assert.calledWith(_createBrowserHistory, { forceRefresh: false });
    });

    it('reads the initial state when creating a browser history and sets `forceRefresh` to the value of the loadedPageIsAnonymous prop', async () => {
      const _createBrowserHistory = sinon.spy(createBrowserHistory);
      const { store } = createAmoStore();
      store.dispatch(loadedPageIsAnonymous());
      // This simulates what the `ServerHtml` component would do (i.e.
      // serializing the server redux state in the HTML).
      document.body.innerHTML = `
        <script type="application/json" id="redux-store-state">
          ${serialize(store.getState(), { isJSON: true })}
        </script>
      `;

      await _createClient({ _createBrowserHistory });

      sinon.assert.calledWith(_createBrowserHistory, { forceRefresh: true });
    });
  });
});
