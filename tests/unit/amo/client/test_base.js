import { createBrowserHistory } from 'history';
import serialize from 'serialize-javascript';

import createAmoStore from 'amo/store';
import createClient from 'amo/client/base';
import { loadedPageIsAnonymous } from 'amo/reducers/site';
import { storeTrackingEvent } from 'amo/reducers/tracking';
import { createFakeTracking } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('createClient()', () => {
    let fakeFastClick;

    beforeEach(() => {
      fakeFastClick = {
        attach: sinon.stub(),
      };
    });

    const _createClient = ({
      _FastClick = fakeFastClick,
      createStore = createAmoStore,
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
      const storeResult = createAmoStore();
      const createStore = () => storeResult;

      const props = await _createClient({ createStore });
      expect(props).toHaveProperty('store', storeResult.store);
    });

    it('updates the tracking page on location change', async () => {
      const _tracking = createFakeTracking();
      const { history } = await _createClient({ _tracking });
      const pathname = '/foo';

      history.push({ pathname });

      sinon.assert.calledWith(_tracking.setPage, pathname);
      sinon.assert.calledWith(_tracking.pageView, { title: '' });
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

    it('reads queued events from initial state and sends them via tracking', async () => {
      const _tracking = createFakeTracking();
      const { store } = createAmoStore();
      const event1 = { action: 'some-action', category: 'some-category' };
      const event2 = {
        action: 'some-action-2',
        category: 'some-category-2',
        label: 'some-label',
        value: 1,
      };
      store.dispatch(storeTrackingEvent({ event: event1 }));
      store.dispatch(storeTrackingEvent({ event: event2 }));
      // This simulates what the `ServerHtml` component would do (i.e.
      // serializing the server redux state in the HTML).
      document.body.innerHTML = `
        <script type="application/json" id="redux-store-state">
          ${serialize(store.getState(), { isJSON: true })}
        </script>
      `;

      await _createClient({ _tracking });

      sinon.assert.calledTwice(_tracking.sendEvent);
      sinon.assert.calledWith(_tracking.sendEvent, {
        ...event1,
        label: undefined,
        value: undefined,
      });
      sinon.assert.calledWith(_tracking.sendEvent, event2);
    });
  });
});
