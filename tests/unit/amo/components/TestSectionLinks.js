import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import SectionLinks, { SectionLinksBase } from 'amo/components/SectionLinks';
import { setClientApp } from 'core/actions';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  getFakeI18nInst,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let _store;
  const foo = 'nar';

  beforeEach(() => {
    _store = dispatchClientMetadata().store;
  });

  function render(customProps = {}) {
    const props = {
      store: _store,
      i18n: getFakeI18nInst(),
      ...customProps,
    };
    return shallowUntilTarget(<SectionLinks {...props} />, SectionLinksBase);
  }

  it('renders four sections', () => {
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(root.find('.SectionLinks-link').length).toEqual(4);
  });

  it('renders Explore active on homepage', () => {
    _store.dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));
    const root = render();

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Explore');
  });

  it('renders Explore active when exploring', () => {
    const root = render({ viewContext: VIEW_CONTEXT_HOME });

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Explore');
  });

  it('renders Extensions active when addonType is extensions', () => {
    _store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));
    const root = render();

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Extensions');
  });

  it('renders Themes active when addonType is themes', () => {
    _store.dispatch(setViewContext(ADDON_TYPE_THEME));
    const root = render();

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Themes');
  });

  it('renders Language Tools active when viewContext is languageTools', () => {
    _store.dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));
    const root = render();

    expect(root.find('.SectionLinks-dropdownlink--active').children())
      .toIncludeText('Dictionaries & Language Packs');
  });

  it('shows Firefox in header for Firefox clientApp', () => {
    _store.dispatch(setClientApp(CLIENT_APP_FIREFOX));
    const root = render();

    expect(root.find('.SectionLinks-subheader').at(0).children())
      .toIncludeText('for Firefox');
  });

  it('shows Android in header for Android clientApp', () => {
    _store.dispatch(setClientApp(CLIENT_APP_ANDROID));
    const root = render();

    expect(root.find('.SectionLinks-subheader').at(0).children())
      .toIncludeText('for Firefox for Android');
  });

  it('changes clientApp when Android site link clicked', () => {
    const dispatchSpy = sinon.spy(_store, 'dispatch');
    const fakeEvent = createFakeEvent({
      currentTarget: {
        getAttribute: (attribute) => {
          if (attribute === 'data-clientapp') {
            return CLIENT_APP_ANDROID;
          }
          if (attribute === 'href') {
            return '/en-US/android/';
          }
        },
      },
    });
    const getAttributeSpy = sinon.spy(fakeEvent.currentTarget, 'getAttribute');
    const fakeRouter = { push: sinon.stub() };
    const root = render({ router: fakeRouter });

    root.find('.SectionLinks-clientApp-switch-android')
      .simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    sinon.assert.calledWith(getAttributeSpy, 'data-clientapp');
    sinon.assert.calledWith(getAttributeSpy, 'href');
    sinon.assert.calledWith(dispatchSpy, setClientApp(CLIENT_APP_ANDROID));
    sinon.assert.calledWith(fakeRouter.push, '/en-US/android/');
  });
});
