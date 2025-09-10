import path from 'path';
import EventEmitter from 'events';

import fs from 'fs-extra';
import httpMocks from 'node-mocks-http';

import {
  viewFrontendVersionHandler,
  viewHeartbeatHandler,
} from 'amo/utils/server';
import { getFakeConfig, getFakeLogger } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('viewFrontendVersionHandler', () => {
    const basePath = path.join(__dirname, 'fixtures');
    const versionJson = fs.readJsonSync(path.join(basePath, 'version.json'));

    // eslint-disable-next-line jest/no-done-callback
    it('exposes the version.json file', (done) => {
      const _config = getFakeConfig({ basePath });
      const handler = viewFrontendVersionHandler({ _config });

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      handler(null, res);

      res.on('end', () => {
        expect(res.statusCode).toEqual(200);
        expect(res.get('content-type')).toEqual('application/json');
        expect(res.get('access-control-allow-origin')).toEqual('*');
        expect(res._getJSONData()).toMatchObject(versionJson);

        done();
      });
    });

    // eslint-disable-next-line jest/no-done-callback
    it('exposes the experiments and feature flags', (done) => {
      const experiments = {
        ab_test_1: true,
      };
      const featureFlags = {
        enableFeatureFoo001: true,
        enableFeatureBar123: false,
      };

      const _config = getFakeConfig(
        { basePath, experiments, ...featureFlags },
        { allowUnknownKeys: true },
      );
      const handler = viewFrontendVersionHandler({ _config });

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      handler(null, res);

      res.on('end', () => {
        expect(res._getJSONData()).toMatchObject({
          ...versionJson,
          experiments,
          feature_flags: {
            ...featureFlags,
          },
        });

        done();
      });
    });

    // eslint-disable-next-line jest/no-done-callback
    it('returns a 415 and logs an error when file does not exist', (done) => {
      const _config = getFakeConfig({ basePath: '/some/invalid/path' });
      const _log = getFakeLogger();

      const handler = viewFrontendVersionHandler({ _config, _log });

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      handler(null, res);

      res.on('end', () => {
        expect(res.statusCode).toEqual(415);
        sinon.assert.calledOnce(_log.error);

        done();
      });
    });
  });

  describe('viewHeartbeatHandler', () => {
    it('calls the site API and returns 200 if successful', async () => {
      const apiHost = 'https://somehost/';
      const apiPath = 'some/path/';
      const apiVersion = 'someVersion';
      const _config = getFakeConfig({ apiHost, apiPath, apiVersion });
      const _fetch = jest.fn().mockResolvedValue({ status: 200 });
      const handler = viewHeartbeatHandler({ _config, _fetch });

      const res = httpMocks.createResponse();
      await handler(null, res);

      expect(_fetch).toHaveBeenCalledWith(
        `${apiHost}${apiPath}${apiVersion}/site/?disable_caching`,
      );
      expect(res.statusCode).toEqual(200);
    });

    it('returns a 500 if there is an API error', async () => {
      const _fetch = jest.fn().mockResolvedValue({ status: 400 });
      const handler = viewHeartbeatHandler({ _fetch });

      const res = httpMocks.createResponse();
      await handler(null, res);

      expect(res.statusCode).toEqual(500);
    });

    it('returns a 500 if fetch fails', async () => {
      const _fetch = jest.fn().mockRejectedValue();
      const handler = viewHeartbeatHandler({ _fetch });

      const res = httpMocks.createResponse();
      await handler(null, res);

      expect(res.statusCode).toEqual(500);
    });
  });
});
