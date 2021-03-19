import EventEmitter from 'events';

import { responseTime } from 'amo/middleware/responseTime';
import { getFakeConfig, getFakeLogger } from 'tests/unit/helpers';
import { ServerTestHelper } from 'tests/unit/amo/server/test_base';

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
        statsdHost: 'localhost',
        statsdPort: 1111,
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

    it('requires a host to send data', async () => {
      const config = getFakeConfig({
        statsdHost: null,
        statsdPort: null,
      });
      await testClient({ config }).get('/');

      sinon.assert.notCalled(hotShotsClient.timing);
    });

    it('records timing for GET responses', async () => {
      await testClient().get('/');

      sinon.assert.calledWith(
        hotShotsClient.timing,
        'response_time.GET_301',
        sinon.match.number,
      );
    });

    it('records timing for POST responses', async () => {
      await testClient().post('/en-US/firefox/something/', {});

      sinon.assert.calledWith(
        hotShotsClient.timing,
        'response_time.POST_200',
        sinon.match.number,
      );
    });

    it('increments counts for GET responses', async () => {
      await testClient().get('/');

      sinon.assert.calledWith(hotShotsClient.increment, 'response.GET');
    });

    it('increments counts for POST responses', async () => {
      await testClient().post('/en-US/firefox/something/', {});

      sinon.assert.calledWith(hotShotsClient.increment, 'response.POST');
    });

    it('increments response status counts', async () => {
      await testClient().get('/');

      sinon.assert.calledWith(hotShotsClient.increment, 'response.301');
    });
  });

  describe('configuration', () => {
    const statsdHost = 'some-statsd-host';
    const statsdPort = 3333;

    const _config = getFakeConfig({
      statsdHost,
      statsdPort,
    });

    it('configures the client', () => {
      const env = 'test';
      const oldNodeConfigEnv = process.env.NODE_CONFIG_ENV;
      process.env.NODE_CONFIG_ENV = env;

      responseTime({ _config, _HotShots: StubHotShots });

      sinon.assert.calledWithMatch(StubHotShots, {
        host: statsdHost,
        port: statsdPort,
        prefix: `addons-frontend-${env}.server.`,
      });

      process.env.NODE_CONFIG_ENV = oldNodeConfigEnv;
    });

    it('sets up error handling', () => {
      const _log = getFakeLogger();
      responseTime({ _config, _HotShots: StubHotShots, _log });

      const error = new Error('some socket error');
      hotShotsClient.socket.emit('error', error);

      sinon.assert.calledWith(_log.error, sinon.match(error.message));
    });
  });
});
