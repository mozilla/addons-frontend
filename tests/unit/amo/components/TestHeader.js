import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Header, { HeaderBase, mapStateToProps } from 'amo/components/Header';
import Link from 'amo/components/Link';
import { VIEW_CONTEXT_EXPLORE, VIEW_CONTEXT_HOME } from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { getFakeI18nInst, shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  function renderHeader({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <Header i18n={getFakeI18nInst()} store={store} {...props} />,
      HeaderBase,
    );
  }

  it('renders an <h1> when isHomepage is true', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(setViewContext(VIEW_CONTEXT_HOME));
    const root = renderHeader({ store });

    expect(root.find('.Header-title-wrapper')).toHaveTagName('h1');
    expect(root.find(Link)).toHaveLength(1);
    expect(root.find('.Header-title').prop('children'))
      .toContain('Firefox Add-ons');
  });

  it('always renders a link in the header when not on homepage', () => {
    const root = renderHeader();

    // There shouldn't be an H1 in the header on pages that aren't the
    // homepage; other routes will render their own, more relevant, H1 tags.
    expect(root.find('h1')).toHaveLength(0);
    expect(root.find(Link)).toHaveLength(1);
    expect(root.find('.Header-title').prop('children'))
      .toContain('Firefox Add-ons');
  });

  describe('mapStateToProps', () => {
    it('gets isHomePage from store', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));

      expect(mapStateToProps(store.getState())).toEqual({ isHomePage: false });

      store.dispatch(setViewContext(VIEW_CONTEXT_HOME));

      expect(mapStateToProps(store.getState())).toEqual({ isHomePage: true });
    });
  });
});
