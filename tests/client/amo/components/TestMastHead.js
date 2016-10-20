import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

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

    return findRenderedComponentWithType(renderIntoDocument(
      <MyMastHead i18n={getFakeI18nInst()} {...props} />
    ), MyMastHead).getWrappedInstance();
  }


  it('renders a heading when isHomepage is true', () => {
    const root = renderMastHead({
      isHomePage: true,
      children: FakeChild,
      lang: 'en-GB',
      SearchFormComponent: FakeChild,
    });
    assert.equal(root.title.textContent, 'Firefox Add-ons');
    assert.equal(root.title.tagName, 'H1');
  });

  it('renders a link when isHomepage is false', () => {
    const root = renderMastHead({
      isHomePage: false,
      children: FakeChild,
      lang: 'en-GB',
      SearchFormComponent: FakeChild,
    });
    assert.equal(root.title.textContent, 'Firefox Add-ons');
    assert.equal(root.title.tagName, 'A');
  });
});
