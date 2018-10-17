import themeInstall from 'core/themeInstall';
import { THEME_INSTALL } from 'core/constants';
import { createFakeEvent } from 'tests/unit/helpers';

describe(__filename, () => {
  it('sets-up the event for install', () => {
    const fakeNode = {
      dispatchEvent: sinon.stub(),
    };
    const fakeEvent = createFakeEvent({
      initEvent: sinon.stub(),
    });
    const fakeDoc = {
      createEvent: sinon.stub(),
    };
    fakeDoc.createEvent.returns(fakeEvent);

    themeInstall(fakeNode, fakeDoc);

    sinon.assert.calledWith(fakeDoc.createEvent, 'Events');
    sinon.assert.calledWith(fakeEvent.initEvent, THEME_INSTALL, true, false);
    sinon.assert.calledWith(fakeNode.dispatchEvent, fakeEvent);
  });
});
