import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import CategoryInfo from 'amo/components/CategoryInfo';


describe('CategoryInfo', () => {
  const categories = [
    {
      application: 'firefox',
      name: 'motorbikes',
      slug: 'motorbikes',
      type: 'extension',
    },
    {
      application: 'android',
      name: 'Travel',
      slug: 'travel',
      type: 'extension',
    },
    {
      application: 'android',
      name: 'Cats',
      slug: 'cats',
      type: 'theme',
    },
  ];

  function render({ ...props }) {
    const initialState = {
      api: { clientApp: 'android', lang: 'fr' },
      categories: { ...categories },
    };

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <CategoryInfo {...props} />
      </Provider>
    ), CategoryInfo));
  }

  it('renders CategoryInfo', () => {
    const root = render({
      addonType: 'extension',
      categories,
      slug: 'travel',
    });

    assert.equal(root.querySelector('.CategoryInfo-header').textContent,
      'Travel');
  });

  it('uses the slug in the class name', () => {
    const root = render({
      addonType: 'extension',
      categories,
      slug: 'travel',
    });

    assert.include(root.className, 'travel');
  });

  it("doesn't render if all props don't match", () => {
    const root = render({
      addonType: 'extension',
      categories,
      slug: 'motorbikes',
    });

    assert.equal(root, null);
  });

  it("doesn't render if there are no categories", () => {
    const root = render({
      addonType: 'extension',
      categories: null,
      slug: 'travel',
    });

    assert.equal(root, null);
  });
});
