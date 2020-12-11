import path from 'path';

import fs from 'fs-extra';
import MockExpressResponse from 'mock-express-response';

import { viewFrontendVersionHandler } from 'core/utils/server';
import { getFakeConfig, getFakeLogger } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('viewFrontendVersionHandler', () => {
    const basePath = path.join(__dirname, 'fixtures');
    const versionJson = fs.readJsonSync(path.join(basePath, 'version.json'));

    // eslint-disable-next-line jest/no-done-callback
    it('exposes the version.json file', (done) => {
      const _config = getFakeConfig({ basePath });
      const handler = viewFrontendVersionHandler({ _config });

      const res = new MockExpressResponse();
      handler(null, res);

      res.on('finish', () => {
        expect(res.statusCode).toEqual(200);
        expect(res.get('content-type')).toEqual(
          'application/json; charset=utf-8',
        );
        expect(res._getJSON()).toMatchObject(versionJson);

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

      const res = new MockExpressResponse();
      handler(null, res);

      res.on('finish', () => {
        expect(res._getJSON()).toMatchObject({
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

      const res = new MockExpressResponse();
      handler(null, res);

      res.on('finish', () => {
        expect(res.statusCode).toEqual(415);
        sinon.assert.calledOnce(_log.error);

        done();
      });
    });
  });
});
