import themeAction from 'core/themePreview';
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

  it('returns themeData from getThemeData', () => {
    const themeData = {
	id: 50,
	name: 'my theme',
	headerURL: 'foo.com',
	footerURL: 'bar.com',
	textcolor: '#fff',
	accentcolor: '#000',
	author: 'carmen',
    };

    assert.deepEqual(themeData, getThemeData(themeData));
    // Make sure it doesn't accept extra keys
    assert.deepEqual(themeData, getThemeData({ ...themeData, badKey: true }));
  });
});

