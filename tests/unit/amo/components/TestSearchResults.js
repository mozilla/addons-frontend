import * as React from 'react';

import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import Paginate from 'amo/components/Paginate';
import SearchResults from 'amo/components/SearchResults';
import {
  ADDON_TYPE_STATIC_THEME,
  DEFAULT_UTM_SOURCE,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_SEARCH,
  RECOMMENDED,
} from 'amo/constants';
import {
  createInternalAddonWithLang,
  fakeAddon,
  fakePreview,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    const allProps = {
      paginator: null,
      ...props,
    };

    return defaultRender(<SearchResults {...allProps} />);
  }

  it('renders no results when searched but nothing is found', () => {
    render({
      count: 0,
      filters: { category: 'big-papa' },
      loading: false,
      results: [],
    });

    expect(screen.getByText('No results were found.')).toBeInTheDocument();
  });

  it('renders a message when no results and valid query', () => {
    render({
      count: 0,
      filters: { query: 'test' },
      results: [],
    });

    expect(
      screen.getByText('No results were found for "test".'),
    ).toBeInTheDocument();
  });

  it('renders searching text during search', () => {
    render({
      filters: { query: 'test' },
      loading: true,
    });

    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  it('renders search result placeholders while loading', () => {
    render({
      filters: { query: 'test' },
      loading: true,
    });

    // There will be 4 loading indicators per SearchResult.
    expect(screen.getAllByRole('alert')).toHaveLength(
      DEFAULT_API_PAGE_SIZE * 4,
    );
  });

  it('renders results', () => {
    const headerImageFull =
      'https://addons.mozilla.org/user-media/full/12345.png';
    const results = [
      createInternalAddonWithLang({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
        previews: [
          {
            ...fakePreview,
            image_url: headerImageFull,
          },
        ],
      }),
    ];
    render({
      filters: { query: 'test' },
      loading: false,
      results,
    });

    expect(
      screen.getByRole('link', { name: results[0].name }),
    ).toBeInTheDocument();
    expect(screen.getByAltText(results[0].name)).toHaveAttribute(
      'src',
      headerImageFull,
    );
  });

  it('sets add-on install source to search by default', () => {
    const results = [createInternalAddonWithLang(fakeAddon)];
    render({
      filters: { query: 'ad blockers' },
      loading: false,
      results,
    });

    const expectedLink = [
      `/en-US/android/addon/${results[0].slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
      'utm_medium=referral',
      `utm_content=${INSTALL_SOURCE_SEARCH}`,
    ].join('&');
    expect(screen.getByRole('link', { name: results[0].name })).toHaveAttribute(
      'href',
      expectedLink,
    );
  });

  it('sets add-on install source to recommended when approrpriate', () => {
    const results = [createInternalAddonWithLang(fakeAddon)];
    render({
      filters: { query: 'ad blockers', promoted: RECOMMENDED },
      loading: false,
      results,
    });

    const expectedLink = [
      `/en-US/android/addon/${results[0].slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
      'utm_medium=referral',
      `utm_content=${INSTALL_SOURCE_FEATURED}`,
    ].join('&');
    expect(screen.getByRole('link', { name: results[0].name })).toHaveAttribute(
      'href',
      expectedLink,
    );
  });

  it('passes a paginator as footer prop to the AddonsCard if supplied', () => {
    const paginator = (
      <Paginate count={10} currentPage={1} pathname="/" perPage={5} />
    );
    render({ paginator });

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
});
