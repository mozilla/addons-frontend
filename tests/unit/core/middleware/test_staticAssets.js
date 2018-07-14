import Express from 'express';
import config from 'config';

import { serveAssetsLocally } from 'core/middleware';

describe(__filename, () => {
  it('calls Express.static', () => {
    const expressStub = sinon.stub(Express, 'static');
    sinon
      .stub(config, 'get')
      .withArgs('basePath')
      .returns('foo');
    serveAssetsLocally({ _config: config });
    sinon.assert.calledWith(expressStub, 'foo/dist');
  });

  it('does not blow up if optional args not defined', () => {
    const expressStub = sinon.stub(Express, 'static');
    serveAssetsLocally();
    sinon.assert.calledWithMatch(expressStub, 'addons-frontend/dist');
  });
});
