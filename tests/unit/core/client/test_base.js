import createAmoStore from 'amo/store';
import { setRequestId } from 'core/actions';
import createClient from 'core/client/base';
import { getSentryRelease } from 'core/utils/sentry';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('createClient()', () => {
    const deploymentVersion = '1.2.3';

    let fakeCreateStore;
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

    it('configures RavenJs for Sentry', async () => {
      const publicSentryDsn = 'example-dsn';
      const _config = getFakeConfig({ publicSentryDsn });
      const ravenInstall = sinon.stub();
      const _RavenJs = createFakeRavenJs({ ravenInstall });

      await _createClient({ createStore: createAmoStore, _config, _RavenJs });

      sinon.assert.calledWith(_RavenJs.config, publicSentryDsn, {
        logger: 'client-js',
        release: getSentryRelease({
          appName: _config.get('appName'),
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
  });
});
