import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_POPULAR,
} from 'amo/constants';
import { searchStart } from 'amo/reducers/search';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import {
  createHistory,
  dispatchClientMetadata,
  dispatchSearchResults,
  fakeAddon,
  getElement,
  getSearchErrorHandlerId,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const lang = 'en-US';
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultTag = 'privacy';
  const defaultLocation = `/${lang}/${clientApp}/tag/${defaultTag}/`;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  function render({ history, location = defaultLocation, tag } = {}) {
    const renderOptions = {
      history:
        history ||
        createHistory({
          initialEntries: [
            tag ? `/${lang}/${clientApp}/tag/${tag}/` : location,
          ],
        }),
      store,
    };
    return defaultRender(renderOptions);
  }

  it('removes tag from the query params if tag is in filters', () => {
    const tag = 'myTag';
    const location = `/${lang}/${clientApp}/tag/${tag}/`;
    const history = createHistory({
      initialEntries: [`${location}?tag=${tag}`],
    });
    const pushSpy = jest.spyOn(history, 'push');

    render({ history });

    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Sort by' }),
      'Trending',
    );

    expect(pushSpy).toHaveBeenCalledWith({
      pathname: location,
      query: convertFiltersToQueryParams({
        sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_TRENDING}`,
      }),
    });
  });

  it('causes Search to dispatch a search using tag and sort filters', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      searchStart({
        errorHandlerId: getSearchErrorHandlerId(),
        filters: {
          sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
          tag: defaultTag,
        },
      }),
    );
  });

  it('does not override an existing sort filter', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ location: `${defaultLocation}?sort=${SEARCH_SORT_POPULAR}` });

    expect(dispatch).toHaveBeenCalledWith(
      searchStart({
        errorHandlerId: getSearchErrorHandlerId(),
        filters: {
          sort: SEARCH_SORT_POPULAR,
          tag: defaultTag,
        },
      }),
    );
  });

  it('configures pagination using filters and the tag', () => {
    const page = '2';
    const pageSize = 2;
    const sort = SEARCH_SORT_POPULAR;
    const tag = 'someTag';
    const addons = Array(pageSize).fill(fakeAddon);
    dispatchSearchResults({
      addons,
      count: 5,
      filters: { page, sort, tag },
      pageSize,
      store,
    });

    render({
      location: `/${lang}/${clientApp}/tag/${tag}/?page=${page}&sort=${sort}`,
    });

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/tag/${tag}/?page=1&sort=${SEARCH_SORT_POPULAR}`,
    );
  });

  it('sets the expected title for the tag', async () => {
    render();

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent(
      `Add-ons tagged with ${defaultTag} – Add-ons for Firefox (en-US)`,
    );
  });
});
