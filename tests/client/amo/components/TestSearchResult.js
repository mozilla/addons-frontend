import React from 'react';
import {
  findRenderedDOMComponentWithClass,
  renderIntoDocument,
} from 'react-addons-test-utils';

import SearchResult from 'amo/components/SearchResult';

describe('<SearchResult />', () => {
  const result = {
    name: 'A search result',
    slug: 'a-search-result',
  };
  const root = renderIntoDocument(
    <SearchResult result={result} lang="en-US" />);

  it('renders the name', () => {
    const name = findRenderedDOMComponentWithClass(root, 'SearchResult-name');
    assert.equal(name.textContent, 'A search result');
  });

  it('links to the detail page', () => {
    assert.equal(root.name.props.to, '/en-US/firefox/addon/a-search-result/');
  });
});
