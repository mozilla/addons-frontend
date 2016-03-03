import React from 'react';
import { createRenderer, renderIntoDocument, Simulate } from 'react-addons-test-utils';

import SearchForm from 'search/components/SearchForm';

if (typeof window === 'undefined' && typeof global !== 'undefined') {
  global.sinon = require('sinon');
  global.assert = require('chai').assert;
}

function browser(message, test) {
  if (typeof document === 'undefined') {
    xit(message, test);
  } else {
    it(message, test);
  }
}

function render(component) {
  const renderer = createRenderer();
  renderer.render(component);
  return renderer.getRenderOutput();
}

describe('<SearchForm />', () => {
  let onSearch;
  let root;

  beforeEach(() => {
    onSearch = sinon.spy();
    root = render(<SearchForm onSearch={onSearch} />);
  });

  it('is a form', () => {
    assert.equal(root.type, 'form');
    assert.equal(root.props.className, 'search-form');
  });

  it('renders a form', () => {
    assert.include(root.props.className, 'search-form');
  });

  it('renders a search input', () => {
    const query = root.props.children.filter(({ ref }) => ref === 'query')[0];
    assert.equal(query.props.placeholder, 'Search');
    assert.equal(query.props.type, 'search');
  });

  browser('calls onSearch with a search query', () => {
    root = renderIntoDocument(<SearchForm onSearch={onSearch} />);
    root.refs.query.value = 'adblock';
    Simulate.submit(root.refs.form);
    assert.ok(onSearch.calledWith('adblock'));
  });
});
