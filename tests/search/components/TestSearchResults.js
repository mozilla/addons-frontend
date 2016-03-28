import React from 'react';
import { renderIntoDocument as render, isDOMComponent } from 'react-addons-test-utils';

import SearchResults from 'search/components/SearchResults';


describe('<SearchResults />', () => {
  function renderResults(props) {
    return render(<SearchResults {...props} />);
  }

  it('renders empty search results container', () => {
    const root = renderResults();
    const searchResults = root.refs.container;
    assert.ok(isDOMComponent(searchResults));
    assert.equal(searchResults.childNodes.length, 0);
  });

  it('renders error when query is an empty string', () => {
    const root = renderResults({query: ''});
    const searchResultsMsg = root.refs.message;
    assert.include(searchResultsMsg.firstChild.nodeValue, 'supply a valid search');
  });

  it('renders error when no results and valid query', () => {
    const root = renderResults({query: 'test'});
    const searchResultsMsg = root.refs.message;
    // Using textContent here since we want to see the text inside the p.
    // Since it has dynamic content is wrapped in a span implicitly.
    assert.include(searchResultsMsg.textContent, 'No results were found');
  });

  it('renders a loading message when loading', () => {
    const root = renderResults({
      query: 'test',
      loading: true,
    });
    const searchResultsMsg = root.refs.message;
    assert.equal(searchResultsMsg.textContent, 'Searching...');
  });

  it('renders search results when supplied', () => {
    const root = renderResults({
      query: 'test',
      results: [
        {name: 'result 1', slug: '1'},
        {name: 'result 2', slug: '2'},
      ],
    });
    const searchResultsMsg = root.refs.message;
    assert.include(searchResultsMsg.textContent, 'Your search for "test" returned 2');

    const searchResultsList = root.refs.results;
    assert.include(searchResultsList.textContent, 'result 1');
    assert.include(searchResultsList.textContent, 'result 2');
  });
});
