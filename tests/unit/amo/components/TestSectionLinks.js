import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import SectionLinks, { SectionLinksBase } from 'amo/components/SectionLinks';
import { setClientApp } from 'amo/reducers/api';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'amo/constants';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeHistory,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import DropdownMenu from 'ui/components/DropdownMenu';

describe(__filename, () => {
  let _store;

  beforeEach(() => {
    _store = dispatchClientMetadata().store;
  });

  function render({ history, ...customProps } = {}) {
    const props = {
      store: _store,
      i18n: fakeI18n(),
      ...customProps,
    };
    return shallowUntilTarget(<SectionLinks {...props} />, SectionLinksBase, {
      shallowOptions: createContextWithFakeRouter({ history }),
    });
  }

  it('renders four sections', () => {
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(root.find('.SectionLinks-link')).toHaveLength(4);
  });

  it('renders a DropdownMenu for the "More" section', () => {
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(root.find(DropdownMenu)).toHaveLength(1);
  });

  it('hides link to the Language Tools page on Android clients', () => {
    _store.dispatch(setClientApp(CLIENT_APP_ANDROID));
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(
      root.find('.SectionLinks-dropdownlink').findWhere((element) => {
        return element.prop('to') === '/language-tools/';
      }),
    ).toHaveLength(0);
  });

  it('renders a link to the Language Tools page for non-Android clients', () => {
    _store.dispatch(setClientApp(CLIENT_APP_FIREFOX));
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(
      root.find('.SectionLinks-dropdownlink').findWhere((element) => {
        return element.prop('to') === '/language-tools/';
      }),
    ).toHaveProp('children', 'Dictionaries & Language Packs');
  });

  it('renders Explore active on homepage', () => {
    _store.dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));
    const root = render();

    expect(root.find('.SectionLinks-link--active').children()).toIncludeText(
      'Explore',
    );
  });

  it('renders Explore active when exploring', () => {
    const root = render({ viewContext: VIEW_CONTEXT_HOME });

    expect(root.find('.SectionLinks-link--active').children()).toIncludeText(
      'Explore',
    );
  });

  it('renders Extensions active when addonType is extensions', () => {
    _store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));
    const root = render();

    expect(root.find('.SectionLinks-link--active').children()).toIncludeText(
      'Extensions',
    );
  });

  it('renders Themes active when add-on is a static theme', () => {
    _store.dispatch(setViewContext(ADDON_TYPE_STATIC_THEME));
    const root = render();

    expect(root.find('.SectionLinks-link--active').children()).toIncludeText(
      'Themes',
    );
  });

  it('renders Language Tools active when viewContext is languageTools', () => {
    _store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

    _store.dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));
    const root = render();

    expect(
      root.find('.SectionLinks-dropdownlink--active').children(),
    ).toIncludeText('Dictionaries & Language Packs');
  });

  it('shows Firefox name and hides link in header on Desktop', () => {
    _store.dispatch(setClientApp(CLIENT_APP_FIREFOX));
    const root = render();

    expect(root.find('.SectionLinks-subheader').at(0).children()).toIncludeText(
      'for Firefox',
    );
    expect(
      root.find(`.SectionLinks-clientApp-${CLIENT_APP_ANDROID}`),
    ).toHaveLength(1);
    expect(
      root.find(`.SectionLinks-clientApp-${CLIENT_APP_FIREFOX}`),
    ).toHaveLength(0);
  });

  it('hides link to the Android version of the site when client is Android', () => {
    _store.dispatch(setClientApp(CLIENT_APP_ANDROID));
    const root = render();

    expect(
      root.find(`.SectionLinks-clientApp-${CLIENT_APP_ANDROID}`),
    ).toHaveLength(0);
    expect(
      root.find(`.SectionLinks-clientApp-${CLIENT_APP_FIREFOX}`),
    ).toHaveLength(1);
  });

  it('changes clientApp when different site link clicked', () => {
    const dispatchSpy = sinon.spy(_store, 'dispatch');
    const fakeEvent = createFakeEvent({
      currentTarget: {
        getAttribute: (attribute) => {
          if (attribute === 'data-clientapp') {
            return CLIENT_APP_ANDROID;
          }
          if (attribute === 'href') {
            return `/en-US/${CLIENT_APP_ANDROID}/`;
          }

          return undefined;
        },
      },
    });
    const getAttributeSpy = sinon.spy(fakeEvent.currentTarget, 'getAttribute');
    const fakeHistory = createFakeHistory();

    _store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

    const root = render({ history: fakeHistory });

    root.find(`.SectionLinks-clientApp-android`).simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    sinon.assert.calledWith(getAttributeSpy, 'data-clientapp');
    sinon.assert.calledWith(getAttributeSpy, 'href');
    sinon.assert.calledWith(dispatchSpy, setClientApp(CLIENT_APP_ANDROID));
    sinon.assert.calledWith(fakeHistory.push, `/en-US/${CLIENT_APP_ANDROID}/`);
  });
});
