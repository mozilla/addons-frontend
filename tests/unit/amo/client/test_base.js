/* global window */
import { createBrowserHistory } from 'history';
import serialize from 'serialize-javascript';

import createAmoStore from 'amo/store';
import createClient from 'amo/client/base';
import { THEME_AUTO, THEME_DARK, THEME_STORAGE_KEY } from 'amo/constants';
import { loadedPageIsAnonymous } from 'amo/reducers/site';

describe(__filename, () => {
  describe('createClient()', () => {
    const _createClient = ({
      createStore = createAmoStore,
      ...others
    } = {}) => {
      return createClient(createStore, { ...others });
    };

    afterEach(() => {
      window.localStorage.clear();
      document.documentElement.removeAttribute('data-theme');
    });

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

    it('applies a forced theme saved in localStorage', async () => {
      const storeResult = createAmoStore();
      window.localStorage.setItem(THEME_STORAGE_KEY, THEME_DARK);

      const { store } = await _createClient({
        createStore: () => storeResult,
      });

      expect(store.getState().theme.theme).toEqual(THEME_DARK);
      expect(document.documentElement).toHaveAttribute(
        'data-theme',
        THEME_DARK,
      );
    });

    it('does not set a data-theme attribute for the automatic theme', async () => {
      const storeResult = createAmoStore();
      window.localStorage.setItem(THEME_STORAGE_KEY, THEME_AUTO);

      const { store } = await _createClient({
        createStore: () => storeResult,
      });

      expect(store.getState().theme.theme).toEqual(THEME_AUTO);
      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });

    it('ignores an invalid theme saved in localStorage', async () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');

      await _createClient();

      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });
  });
});
