import EventEmitter from 'events';

import { datadogTiming } from 'core/middleware/datadogTiming';
import { getFakeConfig } from 'tests/unit/helpers';
import { ServerTestHelper } from 'tests/unit/core/server/test_server';

describe(__filename, () => {
  let hotShotsClient;
  let StubHotShots;

  beforeEach(() => {
    hotShotsClient = {
      increment: sinon.stub(),
      socket: new EventEmitter(),
      timing: sinon.stub(),
    };
    // Create a stub that looks like the HotShots class.
    // When instantiated, it returns the object up above as the instance.
    StubHotShots = sinon.stub().returns(hotShotsClient);
  });

  afterEach(() => {
    hotShotsClient.socket.removeAllListeners();
  });

  describe('integration', () => {
    const serverTestHelper = new ServerTestHelper();

    const testClient = (params = {}) => {
      const config = getFakeConfig({
        useDatadog: true,
        datadogHost: 'localhost',
        datadogPort: 1111,
      });
      return serverTestHelper.testClient({
        config,
        _HotShots: StubHotShots,
        ...params,
      });
    };

    beforeEach(() => {
      serverTestHelper.beforeEach();
    });

    afterEach(() => {
      serverTestHelper.afterEach();
    });

    it('can be disabled explicitly', async () => {
      const config = getFakeConfig({
        useDatadog: false,
        datadogHost: 'localhost',
        datadogPort: 1111,
      });
      await testClient({ config })
        .get('/')
        .end();

      sinon.assert.notCalled(hotShotsClient.timing);
    });

    it('requires a host even when enabled', async () => {
      const config = getFakeConfig({
        useDatadog: true,
        datadogHost: null,
        datadogPort: null,
      });
      await testClient({ config })
        .get('/')
        .end();

      sinon.assert.notCalled(hotShotsClient.timing);
    });

    it('records timing for GET responses', async () => {
      await testClient()
        .get('/')
        .end();

      sinon.assert.calledWith(
        hotShotsClient.timing,
        'response.GET.time',
        sinon.match.number,
      );
    });

    it('records timing for POST responses', async () => {
      await testClient()
        .post('/en-US/firefox/something/', {})
        .end();

      sinon.assert.calledWith(
        hotShotsClient.timing,
        'response.POST.time',
        sinon.match.number,
      );
    });

    it('increments counts for GET responses', async () => {
      await testClient()
        .get('/')
        .end();

      sinon.assert.calledWith(hotShotsClient.increment, 'response.GET.count');
    });

    it('increments counts for POST responses', async () => {
      await testClient()
        .post('/en-US/firefox/something/', {})
        .end();

      sinon.assert.calledWith(hotShotsClient.increment, 'response.POST.count');
    });

    it('increments response status counts', async () => {
      await testClient()
        .get('/')
        .end();

      sinon.assert.calledWith(
        hotShotsClient.increment,
        'response_code.301.count',
      );
    });
  });

  describe('configuration', () => {
    it('configures the client', () => {
      const datadogHost = 'some-datadog-host';
      const datadogPort = 3333;

      const _config = getFakeConfig({
        useDatadog: true,
        datadogHost,
        datadogPort,
      });
      datadogTiming({ _config, _HotShots: StubHotShots });

      sinon.assert.calledWithMatch(StubHotShots, {
        host: datadogHost,
        port: datadogPort,
      });
    });

    it('sets up a prefix', () => {
      datadogTiming({ _HotShots: StubHotShots });

      sinon.assert.calledWithMatch(StubHotShots, {
        prefix: 'addons_frontend.server.',
      });
    });

    it('sets up error handling', () => {
      const _log = { error: sinon.stub() };
      datadogTiming({ _log, _HotShots: StubHotShots });

      const error = new Error('some socket error');
      hotShotsClient.socket.emit('error', error);

      sinon.assert.calledWith(_log.error, sinon.match(error.message));
      sinon.assert.calledWithMatch(_log.error, { err: error });
    });
  });
});
