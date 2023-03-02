import Express from 'express';

import { serveAssetsLocally } from 'amo/middleware';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  it('calls Express.static', () => {
    const expressStub = sinon.stub(Express, 'static');
    const _config = getFakeConfig({ basePath: 'foo' });

    serveAssetsLocally({ _config });
    sinon.assert.calledWith(expressStub, 'foo/dist/static');
  });

  it('does not blow up if optional args not defined', () => {
    const expressStub = sinon.stub(Express, 'static');
    serveAssetsLocally();
    sinon.assert.calledWithMatch(
      expressStub,
      /addons-frontend.*\/dist\/static/,
    );
  });
});
