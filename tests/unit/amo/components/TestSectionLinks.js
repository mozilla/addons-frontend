import React from 'react';
import { shallow } from 'enzyme';

import { setViewContext } from 'amo/actions/viewContext';
import { SectionLinksBase, mapStateToProps } from 'amo/components/SectionLinks';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('SectionLinks Component', () => {
  function render(props) {
    return shallow(<SectionLinksBase i18n={getFakeI18nInst()} {...props} />);
  }

  it('renders three sections', () => {
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(root.find('.SectionLinks-link').length).toEqual(3);
  });

  it('renders no active links without context', () => {
    const root = render({ viewContext: null });

    expect(root.find('.SectionLinks-link--active').length).toEqual(0);
  });

  it('renders Explore active on homepage', () => {
    const root = render({ viewContext: VIEW_CONTEXT_EXPLORE });

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Explore');
  });

  it('renders Explore active when exploring', () => {
    const root = render({ viewContext: VIEW_CONTEXT_HOME });

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Explore');
  });

  it('renders Extensions active when addonType is extensions', () => {
    const root = render({ viewContext: ADDON_TYPE_EXTENSION });

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Extensions');
  });

  it('renders Themes active when addonType is themes', () => {
    const root = render({ viewContext: ADDON_TYPE_THEME });

    expect(root.find('.SectionLinks-link--active').children())
      .toIncludeText('Themes');
  });

  describe('mapStateToProps', () => {
    it('maps viewContext', () => {
      const { store } = dispatchSignInActions();
      store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));

      const state = store.getState();

      expect(mapStateToProps(state).viewContext).toEqual(ADDON_TYPE_EXTENSION);
    });
  });
});
