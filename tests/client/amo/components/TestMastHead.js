import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import { MastHeadBase } from 'amo/components/MastHead';
import { getFakeI18nInst } from 'tests/client/helpers';
import translate from 'core/i18n/translate';
import I18nProvider from 'core/i18n/Provider';


class FakeChild extends React.Component {
  render() {
    return <p>The component</p>;
  }
}

describe('MastHead', () => {
  function renderMastHead({ ...props }) {
    const MyMastHead = translate({ withRef: true })(MastHeadBase);
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };
    const { store } = createStore(initialState);

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <MyMastHead {...props} />
        </I18nProvider>
      </Provider>
    ), MyMastHead).getWrappedInstance();
  }

  it('renders an <h1> when isHomepage is true', () => {
    const root = renderMastHead({
      isHomePage: true,
      children: FakeChild,
      SearchFormComponent: FakeChild,
    });
    const headerTag = findDOMNode(root)
      .querySelector('.MastHead-title-wrapper');

    expect(headerTag.textContent).toEqual('Firefox Add-ons');
    expect(headerTag.tagName).toEqual('H1');
  });

  it('always renders a link in the header', () => {
    const root = renderMastHead({
      children: FakeChild,
      SearchFormComponent: FakeChild,
    });
    const titleLink = findDOMNode(root).querySelector('.MastHead-title');
    const h1Tag = findDOMNode(root).querySelector('h1');

    expect(!h1Tag).toBeTruthy();
    expect(titleLink.textContent).toEqual('Firefox Add-ons');
    expect(titleLink.tagName).toEqual('A');
  });
});
