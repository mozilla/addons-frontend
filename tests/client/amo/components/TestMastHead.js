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


class FakeChild extends React.Component {
  render() {
    return <p>The component</p>;
  }
}

describe('MastHead', () => {
  function renderMastHead({ ...props }) {
    const MyMastHead = translate({ withRef: true })(MastHeadBase);
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <MyMastHead i18n={getFakeI18nInst()} {...props} />
      </Provider>
    ), MyMastHead).getWrappedInstance();
  }


  it('renders a heading when isHomepage is true', () => {
    const root = renderMastHead({
      application: 'firefox',
      isHomePage: true,
      children: FakeChild,
      SearchFormComponent: FakeChild,
    });
    assert.equal(root.title.textContent, 'Firefox Add-ons');
    assert.equal(root.title.tagName, 'H1');
  });

  it('renders a link when isHomepage is false', () => {
    const root = renderMastHead({
      application: 'firefox',
      isHomePage: false,
      children: FakeChild,
      SearchFormComponent: FakeChild,
    });
    const titleLink = findDOMNode(root).querySelectorAll('.MastHead-title')[0];

    assert.equal(titleLink.textContent, 'Firefox Add-ons');
    assert.equal(titleLink.tagName, 'A');
  });
});
