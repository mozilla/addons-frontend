import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

import SearchResults from 'search/components/SearchResults';

const render = ReactTestUtils.renderIntoDocument;
const findByTag = ReactTestUtils.findRenderedDOMComponentWithTag;
const findByClass = ReactTestUtils.findRenderedDOMComponentWithClass;
const isDOMComponent = ReactTestUtils.isDOMComponent;


describe('<SearchResults />', () => {
  function renderResults(props) {
    return render(<SearchResults {...props} />);
  }

  it('renders empty search results container', () => {
    const root = renderResults();
    const searchResults = findByClass(root, 'search-results');
    assert.ok(isDOMComponent(searchResults));
    assert.equal(searchResults.childNodes.length, 0);
  });

  it('renders error when query is an empty string', () => {
    const root = renderResults({query: ''});
    const searchResultsMsg = findByTag(root, 'p');
    assert.include(searchResultsMsg.firstChild.nodeValue, 'supply a valid search');
  });

  it('renders error when no results and valid query', () => {
    const root = renderResults({query: 'test'});
    const searchResultsMsg = findByTag(root, 'p');
    // Using textContent here since we want to see the text inside the p.
    // Since it has dynamic content is wrapped in a span implicitly.
    assert.include(searchResultsMsg.textContent, 'No results were found');
  });

  it('renders search results when supplied', () => {
    const root = renderResults({
      query: 'test',
      results: [
        {title: 'result 1'},
        {title: 'result 2'},
      ],
    });
    const searchResultsMsg = findByTag(root, 'p');
    assert.include(searchResultsMsg.textContent, 'Your search for "test" returned 2');

    const searchResultsList = findByTag(root, 'ul');
    assert.include(searchResultsList.textContent, 'result 1');
    assert.include(searchResultsList.textContent, 'result 2');
  });
});
