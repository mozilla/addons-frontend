import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import SectionLinks, { SectionLinksBase } from 'amo/components/SectionLinks';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { getFakeI18nInst, shallowUntilTarget } from 'tests/unit/helpers';


describe('SectionLinks Component', () => {
  let _store;

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

  it('renders three sections', () => {
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(root.find('.SectionLinks-link').length).toEqual(3);
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
});
