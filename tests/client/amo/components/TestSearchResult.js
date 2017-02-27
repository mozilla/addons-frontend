import React from 'react';
import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithClass,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import SearchResult from 'amo/components/SearchResult';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('<SearchResult />', () => {
  function renderResult(result, { lang = 'en-GB' } = {}) {
    const initialState = { api: { clientApp: 'android', lang } };

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <I18nProvider i18n={getFakeI18nInst({ lang })}>
          <SearchResult addon={result} />
        </I18nProvider>
      </Provider>
    ), SearchResult).getWrappedInstance();
  }

  const result = {
    ...fakeAddon,
    authors: [
      { name: 'A funky déveloper' },
      { name: 'A groovy developer' },
    ],
    average_daily_users: 5253,
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
    assert.equal(users.textContent, ' — 5,253 users');
  });

  it('localises the user count', () => {
    const localisedRoot = renderResult(result, { lang: 'fr' });
    const users = findRenderedDOMComponentWithClass(localisedRoot, 'SearchResult-users');
    // \xa0 is a non-breaking space.
    assert.match(users.textContent, /5\xa0253/);
  });

  it('renders the user count as singular', () => {
    const renderedResult = renderResult({ ...result, average_daily_users: 1 });
    const users = findRenderedDOMComponentWithClass(renderedResult,
                                                    'SearchResult-users');
    assert.equal(users.textContent, ' — 1 user');
  });

  it('links to the detail page', () => {
    assert.equal(root.name.props.to, '/addon/a-search-result/');
  });

  it('renders the star ratings', () => {
    const node = findRenderedDOMComponentWithClass(root, 'Rating');
    assert.equal(node.textContent,
                 `Rated ${fakeAddon.ratings.average} out of 5`);
  });

  it('displays a placeholder if the icon is malformed', () => {
    const themeResult = {
      ...result,
      icon_url: 'whatevs',
    };
    const themeRoot = renderResult(themeResult);
    const iconPlaceholder = findRenderedDOMComponentWithClass(
      themeRoot, 'SearchResult-icon');
    const iconSrc = iconPlaceholder.src;
    assert.ok(iconSrc.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAA'), iconSrc);
  });

  it('adds theme specific class', () => {
    const themeResult = {
      ...result,
      type: ADDON_TYPE_THEME,
      theme_data: {
        previewURL: 'https://addons.cdn.mozilla.net/user-media/addons/334902/preview_large.jpg?1313374873',
      },
    };
    const themeRoot = renderResult(themeResult);
    const themeSearchResult = findRenderedDOMComponentWithClass(
      themeRoot, 'SearchResult--theme');
    assert.ok(themeSearchResult);
  });

  it('displays a message if the theme preview image is bogus', () => {
    const themeResult = {
      ...result,
      type: ADDON_TYPE_THEME,
    };
    const themeRoot = renderResult(themeResult);
    const themeSearchNoImage = findRenderedDOMComponentWithClass(
      themeRoot, 'SearchResult-notheme');
    assert.equal(themeSearchNoImage.textContent, 'No theme preview available');
  });
});
