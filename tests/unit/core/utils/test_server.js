import fs from 'fs-extra';
import path from 'path';

import MockExpressResponse from 'mock-express-response';

import { viewFrontendVersionHandler } from 'core/utils/server';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('viewFrontendVersionHandler', () => {
    it('exposes the version.json file', (done) => {
      const basePath = path.join(__dirname, '__fixtures__');
      const versionJson = fs.readJsonSync(path.join(basePath, 'version.json'));

      const _config = getFakeConfig({ basePath });
      const handler = viewFrontendVersionHandler({ _config });

      const res = new MockExpressResponse();
      handler(null, res);

      res.on('finish', () => {
        expect(res.statusCode).toEqual(200);
        expect(res.get('content-type')).toEqual('application/json');
        expect(res._getJSON()).toEqual(versionJson);

        done();
      });
    });
  });
});
