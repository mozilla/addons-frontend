import React from 'react';
import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithClass,
  scryRenderedDOMComponentsWithClass,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import SearchResult from 'amo/components/SearchResult';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('<SearchResult />', () => {
  function renderResult(result, { lang = 'en-GB' } = {}) {
    const initialState = { api: { clientApp: 'android', lang } };
    const { store } = createStore(initialState);

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
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
    expect(heading.textContent).toEqual('A search result');
  });

  it('renders the author', () => {
    const node = findRenderedDOMComponentWithClass(root,
                                                   'SearchResult-author');
    expect(node).toBeTruthy();
  });

  it('ignores an empty author list', () => {
    const myRoot = renderResult({ ...result, authors: undefined });
    const nodes = scryRenderedDOMComponentsWithClass(myRoot, 'SearchResult-author');
    expect(nodes.length).toEqual(0);
  });

  it("renders only the first author's name when there are multiple", () => {
    const authors = findRenderedDOMComponentWithClass(root, 'SearchResult-author');
    expect(authors.textContent).toEqual('A funky déveloper');
  });

  it('renders the user count', () => {
    const users = findRenderedDOMComponentWithClass(root, 'SearchResult-users');
    expect(users.textContent).toEqual('5,253 users');
  });

  it('localises the user count', () => {
    const localisedRoot = renderResult(result, { lang: 'fr' });
    const users = findRenderedDOMComponentWithClass(localisedRoot, 'SearchResult-users');
    // \xa0 is a non-breaking space.
    expect(users.textContent).toMatch(/5\xa0253/);
  });

  it('renders the user count as singular', () => {
    const renderedResult = renderResult({ ...result, average_daily_users: 1 });
    const users = findRenderedDOMComponentWithClass(renderedResult,
                                                    'SearchResult-users');
    expect(users.textContent).toEqual('1 user');
  });

  it('links to the detail page', () => {
    expect(root.name.props.to).toEqual('/addon/a-search-result/');
  });

  it('renders the star ratings', () => {
    const node = findRenderedDOMComponentWithClass(root, 'Rating');
    expect(node.textContent).toEqual(`Rated ${fakeAddon.ratings.average} out of 5`);
  });

  it('displays a placeholder if the icon is malformed', () => {
    const themeResult = {
      ...result,
      icon_url: 'whatevs',
    };
    const themeRoot = renderResult(themeResult);
    const iconPlaceholder = findRenderedDOMComponentWithClass(
      themeRoot, 'SearchResult-icon');
    // image requires under jest return the filename.
    expect(iconPlaceholder.src).toEqual('default-64.png');
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
    expect(themeSearchResult).toBeTruthy();
  });

  it('displays a message if the theme preview image is bogus', () => {
    const themeResult = {
      ...result,
      type: ADDON_TYPE_THEME,
    };
    const themeRoot = renderResult(themeResult);
    const themeSearchNoImage = findRenderedDOMComponentWithClass(
      themeRoot, 'SearchResult-notheme');
    expect(themeSearchNoImage.textContent).toEqual('No theme preview available');
  });
});
