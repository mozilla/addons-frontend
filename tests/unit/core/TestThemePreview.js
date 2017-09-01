import themeAction, { getThemeData } from 'core/themePreview';
import { THEME_PREVIEW } from 'core/constants';

describe('Theme Preview Lib', () => {
  it('throws for invalid action', () => {
    expect(() => {
      themeAction(null, 'whatever');
    }).toThrowError('Invalid theme action requested');
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
    expect(fakeDoc.createEvent.calledWith('Events')).toBeTruthy();
    expect(
      fakeEvent.initEvent.calledWith(THEME_PREVIEW, true, false)
    ).toBeTruthy();
    expect(fakeNode.dispatchEvent.calledWith(fakeEvent)).toBeTruthy();
  });

  it('returns themeData from getThemeData', () => {
    const themeData = {
      id: 50,
      name: 'my theme',
      description: 'my theme description',
      headerURL: 'foo.com',
      footerURL: 'bar.com',
      textcolor: '#fff',
      accentcolor: '#000',
      author: 'carmen',
    };

    expect(themeData).toEqual(getThemeData(themeData));
    // Make sure it doesn't accept extra keys
    expect(themeData).toEqual(getThemeData({ ...themeData, badKey: true }));
  });
});
