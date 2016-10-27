import React from 'react';
import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithClass,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import SearchResult from 'amo/components/SearchResult';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<SearchResult />', () => {
  function renderResult(result) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <SearchResult i18n={getFakeI18nInst()} result={result} />
      </Provider>
    ), SearchResult).getWrappedInstance();
  }

  const result = {
    authors: [
      { name: 'A funky déveloper' },
      { name: 'A groovy developer' },
    ],
    average_daily_users: 553,
    name: 'A search result',
    slug: 'a-search-result',
  };
  const root = renderResult(result);

  it('renders the heading', () => {
    const heading = findRenderedDOMComponentWithClass(
      root, 'SearchResult-heading');
    assert.equal(heading.textContent, 'A search result');
  });

  it('renders the author', () => {
    const node = findRenderedDOMComponentWithClass(root,
                                                   'SearchResult-author');
    assert.ok(node);
  });

  it("renders only the first author's name when there are multiple", () => {
    const authors = findRenderedDOMComponentWithClass(root,
                                                      'SearchResult-author');
    assert.equal(authors.textContent, 'A funky déveloper');
  });

  it('renders the user count', () => {
    const users = findRenderedDOMComponentWithClass(root, 'SearchResult-users');
    assert.equal(users.textContent, '553 users');
  });

  it('renders the user count as singular', () => {
    const renderedResult = renderResult({ ...result, average_daily_users: 1 });
    const users = findRenderedDOMComponentWithClass(renderedResult,
                                                    'SearchResult-users');
    assert.equal(users.textContent, '1 user');
  });

  it('links to the detail page', () => {
    assert.equal(root.name.props.to, '/addon/a-search-result/');
  });
});
