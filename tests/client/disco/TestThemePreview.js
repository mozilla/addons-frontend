import themeAction from 'disco/themePreview';
import { THEME_PREVIEW } from 'core/constants';


describe('Theme Preview Lib', () => {
  it('throws for invalid action', () => {
    assert.throws(() => {
      themeAction(null, 'whatever');
    }, Error, 'Invalid theme action requested');
  });

  it('sets-up the event for previews', () => {
    const fakeNode = {
      dispatchEvent: sinon.stub(),
    };
    const fakeEvent = {
      initEvent: sinon.stub(),
    };
    const fakeDoc = {
      createEvent: sinon.stub(),
    };
    fakeDoc.createEvent.returns(fakeEvent);
    themeAction(fakeNode, THEME_PREVIEW, fakeDoc);
    assert.ok(fakeDoc.createEvent.calledWith('Events'), 'Should call createEvent');
    assert.ok(fakeEvent.initEvent.calledWith(THEME_PREVIEW, true, false), 'Should call initEvent');
    assert.ok(fakeNode.dispatchEvent.calledWith(fakeEvent), 'should call dispatchEvent');
  });
});

