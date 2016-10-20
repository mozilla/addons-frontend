import React from 'react';
import {
  renderIntoDocument as render,
  findRenderedComponentWithType,
  isDOMComponent,
} from 'react-addons-test-utils';

import SearchResults from 'core/components/Search/SearchResults';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<SearchResults />', () => {
  function renderResults(props) {
    return findRenderedComponentWithType(render(
      <SearchResults i18n={getFakeI18nInst()} {...props} />
    ), SearchResults).getWrappedInstance();
  }

  it('renders empty search results container', () => {
    const root = renderResults();
    const searchResults = root.container;
    assert.ok(isDOMComponent(searchResults));
    assert.equal(searchResults.childNodes.length, 0);
  });

  it('renders error when query is an empty string', () => {
    const root = renderResults({ query: '' });
    const searchResultsMessage = root.message;
    assert.include(searchResultsMessage.firstChild.nodeValue,
                   'supply a valid search');
  });

  it('renders error when no results and valid query', () => {
    const root = renderResults({ query: 'test' });
    const searchResultsMessage = root.message;
    // Using textContent here since we want to see the text inside the p.
    // Since it has dynamic content is wrapped in a span implicitly.
    assert.include(searchResultsMessage.textContent, 'No results were found');
  });

  it('renders a loading message when loading', () => {
    const root = renderResults({
      query: 'test',
      loading: true,
    });
    const searchResultsMessage = root.message;
    assert.equal(searchResultsMessage.textContent, 'Searching...');
  });

  it('renders search results when supplied', () => {
    const root = renderResults({
      count: 5,
      query: 'test',
      results: [
        { name: 'result 1', slug: '1' },
        { name: 'result 2', slug: '2' },
      ],
    });
    const searchResultsMessage = root.message;
    assert.include(searchResultsMessage.textContent,
                   'Your search for "test" returned 5 results');

    const searchResultsList = root.results;
    assert.include(searchResultsList.textContent, 'result 1');
    assert.include(searchResultsList.textContent, 'result 2');
  });

  it('renders search results in the singular', () => {
    const root = renderResults({
      count: 1,
      query: 'test',
      results: [
        { name: 'result 1', slug: '1' },
      ],
    });
    const searchResultsMessage = root.message;
    assert.include(searchResultsMessage.textContent,
                   'Your search for "test" returned 1 result');
  });
});
