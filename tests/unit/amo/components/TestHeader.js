import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import { setViewContext } from 'amo/actions/viewContext';
import createStore from 'amo/store';
import { HeaderBase, mapStateToProps } from 'amo/components/Header';
import { setClientApp, setLang } from 'core/actions';
import { VIEW_CONTEXT_EXPLORE, VIEW_CONTEXT_HOME } from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/unit/helpers';


class FakeChild extends React.Component {
  render() {
    return <p>The component</p>;
  }
}

describe('Header', () => {
  function renderHeader({ ...props }) {
    const { store } = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('en-GB'));
    const fakeI18n = getFakeI18nInst();

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={fakeI18n}>
          <HeaderBase i18n={fakeI18n} {...props} />
        </I18nProvider>
      </Provider>
    ), HeaderBase);
  }

  it('renders an <h1> when isHomepage is true', () => {
    const root = renderHeader({
      isHomePage: true,
      children: FakeChild,
      SearchFormComponent: FakeChild,
    });
    const headerTag = findDOMNode(root).querySelector('.Header-title-wrapper');

    expect(headerTag.textContent).toEqual('Firefox Add-ons');
    expect(headerTag.tagName).toEqual('H1');
  });

  it('always renders a link in the header', () => {
    const root = renderHeader({
      children: FakeChild,
      SearchFormComponent: FakeChild,
    });
    const titleLink = findDOMNode(root).querySelector('.Header-title');
    const h1Tag = findDOMNode(root).querySelector('h1');

    expect(h1Tag).toBeFalsy();
    expect(titleLink.textContent).toEqual('Firefox Add-ons');
    expect(titleLink.tagName).toEqual('A');
  });

  describe('mapStateToProps', () => {
    it('gets isHomePage from store', () => {
      const { store } = createStore();
      store.dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));
      expect(mapStateToProps(store.getState())).toEqual({ isHomePage: false });

      store.dispatch(setViewContext(VIEW_CONTEXT_HOME));
      expect(mapStateToProps(store.getState())).toEqual({ isHomePage: true });
    });
  });
});
