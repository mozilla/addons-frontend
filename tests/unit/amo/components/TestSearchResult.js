import { shallow } from 'enzyme';
import React from 'react';

import { SearchResultBase } from 'amo/components/SearchResult';
import { fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('<SearchResult />', () => {
  const baseAddon = {
    ...fakeAddon,
    authors: [
      { name: 'A funky déveloper' },
      { name: 'A groovy developer' },
    ],
    average_daily_users: 5253,
    name: 'A search result',
    slug: 'a-search-result',
  };

  function render({ addon = baseAddon, lang = 'en-GB', ...props } = {}) {
    return shallow(
      <SearchResultBase
        i18n={getFakeI18nInst({ lang })}
        addon={addon}
        {...props}
      />
    );
  }

  it('renders the heading', () => {
    const root = render();

    expect(root.find('.SearchResult-name'))
      .toIncludeText('A search result');
  });

  it('renders the author', () => {
    const root = render();

    expect(root.find('.SearchResult-author'))
      .toIncludeText('A funky déveloper');
  });

  it('ignores an empty author list', () => {
    const root = render({ addon: { ...fakeAddon, authors: undefined } });

    expect(root).not.toHaveClassName('SearchResult-author');
  });

  it("renders only the first author's name when there are multiple", () => {
    const root = render();

    expect(root.find('.SearchResult-author'))
      .toIncludeText('A funky déveloper');
    expect(root.find('.SearchResult-author'))
      .not.toIncludeText('A groovy developer');
  });

  it('renders the user count', () => {
    const root = render();

    expect(root.find('.SearchResult-users')).toIncludeText('5,253 users');
  });

  it('localises the user count', () => {
    const root = render({ lang: 'fr' });

    expect(root.find('.SearchResult-users-text')).toIncludeText('5 253');
  });

  it('renders the user count as singular', () => {
    const root = render({ addon: { ...fakeAddon, average_daily_users: 1 } });

    expect(root.find('.SearchResult-users')).toIncludeText('1 user');
  });

  it('links to the detail page', () => {
    const root = render();

    expect(root.find('.SearchResult-link'))
      .toHaveProp('to', '/addon/a-search-result/');
  });

  it('renders the star ratings', () => {
    const root = render();

    expect(root.find('.SearchResult-rating').length).toEqual(1);
  });

  it('displays a placeholder if the icon is malformed', () => {
    const addon = { ...fakeAddon, icon_url: 'whatevs' };
    const root = render({ addon });

    // image `require` calls in jest return the filename
    expect(root.find('.SearchResult-icon'))
      .toHaveProp('src', 'default-64.png');
  });

  it('adds a theme-specific class', () => {
    const addon = {
      ...fakeAddon,
      type: ADDON_TYPE_THEME,
      theme_data: {
        previewURL: 'https://addons.cdn.mozilla.net/user-media/addons/334902/preview_large.jpg?1313374873',
      },
    };
    const root = render({ addon });

    expect(root).toHaveClassName('SearchResult--theme');
  });

  it('displays a message if the theme preview image is unavailable', () => {
    const addon = { ...fakeAddon, type: ADDON_TYPE_THEME };
    const root = render({ addon });

    expect(root.find('.SearchResult-notheme'))
      .toIncludeText('No theme preview available');
  });

  it('uses the description if summary is not available', () => {
    // This test can be removed once
    // https://github.com/mozilla/addons-frontend/issues/2626 is fixed.
    const addon = {
      ...fakeAddon,
      summary: null,
      description: 'I describe things!',
    };
    const root = render({ addon });

    expect(root.find('.SearchResult-summary'))
      .toIncludeText('I describe things!');
  });
});
