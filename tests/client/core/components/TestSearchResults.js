import React from 'react';
import ReactDOM from 'react-dom';
import {
  renderIntoDocument as render,
  findRenderedComponentWithType,
  findRenderedDOMComponentWithClass,
  isDOMComponent,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import SearchResults from 'core/components/Search/SearchResults';
import createStore from 'amo/store';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<SearchResults />', () => {
  class FakeCategoryInfo extends React.Component {
    render() {
      return <div className="CategoryInfo-header">Category!</div>;
    }
  }

  function renderResults(props) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findRenderedComponentWithType(render(
      <Provider store={createStore(initialState)}>
        <SearchResults i18n={getFakeI18nInst()} {...props} />
      </Provider>
    ), SearchResults).getWrappedInstance();
  }

  it('renders prompt for query with no search terms', () => {
    const root = renderResults();
    const searchResults = root.container;
    const searchResultsMessage = root.message;
    assert.ok(isDOMComponent(searchResults));
    assert.equal(searchResults.childNodes.length, 1);
    assert.include(searchResultsMessage.firstChild.nodeValue,
                   'Please enter a search term');
  });

  it('renders prompt for query when query is an empty string', () => {
    const root = renderResults({ hasSearchParams: false, query: '' });
    const searchResultsMessage = root.message;
    assert.include(searchResultsMessage.firstChild.nodeValue,
                   'Please enter a search term');
  });

  it('renders no results when no results and valid category', () => {
    const root = renderResults({
      category: 'alerts-updates',
      count: 0,
      hasSearchParams: true,
      loading: false,
      query: '',
      results: [],
    });
    const searchResultsMessage = root.message;
    // Using textContent here since we want to see the text inside the p.
    // Since it has dynamic content is wrapped in a span implicitly.
    assert.include(searchResultsMessage.textContent, 'No results were found');
  });

  it('renders no results when no results and valid query', () => {
    const root = renderResults({
      count: 0,
      hasSearchParams: true,
      loading: false,
      query: 'no results',
      results: [],
    });
    const searchResultsMessage = root.message;
    // Using textContent here since we want to see the text inside the p.
    // Since it has dynamic content is wrapped in a span implicitly.
    assert.include(searchResultsMessage.textContent, 'No results were found');
  });

  it('renders a loading message when loading', () => {
    const root = renderResults({
      hasSearchParams: true,
      loading: true,
      query: 'test',
    });
    const searchResultsMessage = root.message;
    assert.equal(searchResultsMessage.textContent, 'Searching...');
  });

  it('renders search results when supplied', () => {
    const root = renderResults({
      count: 5,
      hasSearchParams: true,
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
      hasSearchParams: true,
      query: 'test',
      results: [
        { name: 'result 1', slug: '1' },
      ],
    });
    const searchResultsMessage = root.message;
    assert.include(searchResultsMessage.textContent,
                   'Your search for "test" returned 1 result');
  });

  it('renders category info when a category is supplied', () => {
    const root = renderResults({
      CategoryInfoComponent: FakeCategoryInfo,
      category: 'alerts-updates',
      clientApp: 'firefox',
      count: 1,
      results: [
        { name: 'result 1', slug: '1' },
      ],
    });
    const categoryInfoHeader = ReactDOM.findDOMNode(
      findRenderedDOMComponentWithClass(root, 'CategoryInfo-header'));
    assert.include(categoryInfoHeader.textContent, 'Category!');
  });

  it('uses the CategoryInfo component', () => {
    const root = renderResults({
      CategoryInfoComponent: null,
      category: 'alerts-updates',
      count: 1,
      results: [
        { name: 'result 1', slug: '1' },
      ],
    });
    assert.throws(() => {
      ReactDOM.findDOMNode(
        findRenderedDOMComponentWithClass(root, 'CategoryInfo-header'));
    }, 'Did not find exactly one match');
  });
});
