import { createBrowserHistory } from 'history';
import serialize from 'serialize-javascript';

import createAmoStore from 'amo/store';
import { setRequestId } from 'core/reducers/api';
import createClient from 'core/client/base';
import { getSentryRelease } from 'core/utils/sentry';
import { loadedPageIsAnonymous } from 'core/reducers/site';
import { getFakeConfig, createFakeTracking } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('createClient()', () => {
    const deploymentVersion = '1.2.3';

    let fakeFastClick;

    function createFakeRavenJs({
      ravenInstall = sinon.stub(),
      ...methods
    } = {}) {
      return {
        config: sinon.stub().returns({ install: ravenInstall }),
        setTagsContext: sinon.stub(),
        ...methods,
      };
    }

    beforeEach(() => {
      global.DEPLOYMENT_VERSION = deploymentVersion;

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

    it('configures RavenJs for Sentry', async () => {
      const publicSentryDsn = 'example-dsn';
      const _config = getFakeConfig({ publicSentryDsn });
      const ravenInstall = sinon.stub();
      const _RavenJs = createFakeRavenJs({ ravenInstall });

      await _createClient({ createStore: createAmoStore, _config, _RavenJs });

      sinon.assert.calledWith(_RavenJs.config, publicSentryDsn, {
        logger: 'client-js',
        release: getSentryRelease({
          version: deploymentVersion,
        }),
      });
      sinon.assert.called(ravenInstall);
    });

    it('adds amo_request_id to RavenJs', async () => {
      const _config = getFakeConfig({ publicSentryDsn: 'example-dsn' });
      const _RavenJs = createFakeRavenJs();

      const storeResult = createAmoStore();
      const requestId = 'example-request-id';
      storeResult.store.dispatch(setRequestId(requestId));

      await _createClient({
        createStore: () => storeResult,
        _config,
        _RavenJs,
      });

      sinon.assert.calledWith(_RavenJs.setTagsContext, {
        amo_request_id: requestId,
      });
    });

    it('does not configure RavenJs without publicSentryDsn', async () => {
      const _config = getFakeConfig({ publicSentryDsn: null });
      const _RavenJs = createFakeRavenJs();

      await _createClient({ _config, _RavenJs });

      sinon.assert.notCalled(_RavenJs.config);
      sinon.assert.notCalled(_RavenJs.setTagsContext);
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
  });
});
