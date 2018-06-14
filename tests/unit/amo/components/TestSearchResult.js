import url from 'url';

import { shallow } from 'enzyme';
import * as React from 'react';

import { SearchResultBase } from 'amo/components/SearchResult';
import { ADDON_TYPE_STATIC_THEME, ADDON_TYPE_THEME } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { sanitizeHTML } from 'core/utils';
import { fakeAddon, fakeTheme } from 'tests/unit/amo/helpers';
import { fakeI18n } from 'tests/unit/helpers';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';


describe(__filename, () => {
  const baseAddon = createInternalAddon({
    ...fakeAddon,
    authors: [
      { name: 'A funky déveloper' },
      { name: 'A groovy developer' },
    ],
    average_daily_users: 5253,
    name: 'A search result',
    slug: 'a-search-result',
  });

  function render({ addon = baseAddon, lang = 'en-GB', ...props } = {}) {
    return shallow(
      <SearchResultBase
        i18n={fakeI18n({ lang })}
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
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, authors: undefined }),
    });

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

    // `\xa0` is a non-breaking space.
    // See: https://github.com/airbnb/enzyme/issues/1349
    expect(root.find('.SearchResult-users-text')).toIncludeText('5\xa0253');
  });

  it('renders the user count as singular', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        average_daily_users: 1,
      }),
    });

    expect(root.find('.SearchResult-users')).toIncludeText('1 user');
  });

  it('links to the detail page', () => {
    const root = render();

    expect(root.find('.SearchResult-link'))
      .toHaveProp('to', '/addon/a-search-result/');
  });

  it('links to the detail page with a source', () => {
    const addonInstallSource = 'home-page-featured';
    const root = render({ addonInstallSource });

    const link = root.find('.SearchResult-link');
    expect(url.parse(link.prop('to'), true).query)
      .toMatchObject({ src: addonInstallSource });
  });

  it('renders the star ratings', () => {
    const root = render();

    expect(root.find('.SearchResult-rating')).toHaveLength(1);
  });

  it('renders the summary', () => {
    const root = render();

    expect(root.find('.SearchResult-summary')).toHaveLength(1);
  });

  it('renders the metadata', () => {
    const root = render();

    expect(root.find('.SearchResult-metadata')).toHaveLength(1);
  });

  it('displays a placeholder if the icon is malformed', () => {
    const addon = createInternalAddon({ ...fakeAddon, icon_url: 'whatevs' });
    const root = render({ addon });

    // image `require` calls in jest return the filename
    expect(root.find('.SearchResult-icon'))
      .toHaveProp('src', 'default-64.png');
  });

  it('adds a theme-specific class', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_THEME,
      theme_data: {
        previewURL: 'https://addons.cdn.mozilla.net/user-media/addons/334902/preview_large.jpg?1313374873',
      },
    });
    const root = render({ addon });

    expect(root).toHaveClassName('SearchResult--theme');
  });

  it('displays a message if the lightweight theme preview image is unavailable', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      // The 'previews' field is not currently being used by lightweight themes
      // So here we are just overridding the fakeAddon values to mimic the API
      // response.
      previews: [],
      theme_data: {
        previewURL: null,
      },
      type: ADDON_TYPE_THEME,
    });
    const root = render({ addon });

    expect(root.find('.SearchResult-notheme'))
      .toIncludeText('No theme preview available');
  });

  it("does not display a 'no theme preview available' message if the lightweight theme preview image is available", () => {
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_THEME,
    });
    const root = render({ addon });

    expect(root.find('.SearchResult-result')).not.toIncludeText('No theme preview available');
  });

  it('displays a message if the static theme preview image is unavailable', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      previews: [],
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });

    expect(root.find('.SearchResult-notheme'))
      .toIncludeText('No theme preview available');
  });

  it("does not display a 'no theme preview available' message if the static theme preview image is available", () => {
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });

    expect(root.find('.SearchResult-result')).not.toIncludeText('No theme preview available');
  });

  it('renders placeholders without an addon', () => {
    const root = render({ addon: null });

    // Since there's no add-on, there shouldn't be a link.
    expect(root.find('.SearchResult-link')).toHaveLength(0);

    expect(root.find('.SearchResult-icon'))
      .toHaveProp('src', 'default-64.png');
    expect(root.find('.SearchResult-name').find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.SearchResult-summary').find(LoadingText))
      .toHaveLength(1);
    expect(root.find(Rating)).toHaveProp('rating', 0);
    expect(root.find('.SearchResult-author').find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.SearchResult-users-text').find(LoadingText))
      .toHaveLength(1);
  });

  it('can hide the summary section', () => {
    const root = render({ showSummary: false });

    expect(root.find('.SearchResult-summary')).toHaveLength(0);
  });

  it('can hide the metadata section', () => {
    const root = render({ showMetadata: false });

    expect(root.find('.SearchResult-metadata')).toHaveLength(0);
  });

  it('displays a note if the addon has a note', () => {
    const notes = 'Some notes.';
    const addon = {
      ...fakeAddon,
      notes,
    };
    const root = render({ addon });

    const note = root.find('.SearchResult-note');
    expect(note).toHaveLength(1);
    expect(note.find(Icon)).toHaveProp('name', 'comments-blue');
    expect(note.find('.SearchResult-note-header'))
      .toIncludeText('Add-on note');
    expect(note.find('.SearchResult-note-content'))
      .toHaveProp('dangerouslySetInnerHTML', sanitizeHTML(notes));
  });

  it('renders newlines in notes', () => {
    const notes = 'Some\nnotes.';
    const addon = {
      ...fakeAddon,
      notes,
    };
    const root = render({ addon });

    const note = root.find('.SearchResult-note');
    expect(note).toHaveLength(1);
    expect(note.find(Icon)).toHaveProp('name', 'comments-blue');
    expect(note.find('.SearchResult-note-header'))
      .toIncludeText('Add-on note');
    const expectedHTML =
      '<div class="SearchResult-note-content">Some<br>notes.</div>';
    expect(note.find('.SearchResult-note-content')).toHaveHTML(expectedHTML);
  });

  it('does not display a note if the addon has no notes', () => {
    const addon = {
      ...fakeAddon,
      notes: null,
    };
    const root = render({ addon });

    expect(root.find('.SearchResult-note')).toHaveLength(0);
  });
});
