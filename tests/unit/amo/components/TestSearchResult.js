import url from 'url';

import * as React from 'react';

import SearchResult, { SearchResultBase } from 'amo/components/SearchResult';
import { getAddonURL } from 'amo/utils';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_SOURCE,
  VERIFIED,
} from 'amo/constants';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeHistory,
  createInternalAddonWithLang,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakePreview,
  fakeTheme,
  normalizeSpaces,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Icon from 'amo/components/Icon';
import LoadingText from 'amo/components/LoadingText';
import Rating from 'amo/components/Rating';
import PromotedBadge from 'amo/components/PromotedBadge';

describe(__filename, () => {
  const baseAddon = createInternalAddonWithLang({
    ...fakeAddon,
    authors: [{ name: 'A funky déveloper' }, { name: 'A groovy developer' }],
    average_daily_users: 5253,
    promoted: null,
    name: createLocalizedString('A search result'),
    slug: 'a-search-result',
  });

  function render({
    addon = baseAddon,
    history = createFakeHistory(),
    lang = 'en-GB',
    noAddon = false,
    store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    }).store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <SearchResult
        addon={noAddon ? undefined : addon}
        i18n={fakeI18n({ lang })}
        store={store}
        {...props}
      />,
      SearchResultBase,
      {
        shallowOptions: createContextWithFakeRouter({ history }),
      },
    );
  }

  it('renders the heading', () => {
    const name = 'A search result';
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      name: createLocalizedString(name),
    });
    const root = render({ addon });

    expect(root.find('.SearchResult-link').children()).toIncludeText(name);
  });

  it('links the heading to the detail page', () => {
    const slug = 'some-addon-slug';
    const addon = createInternalAddonWithLang({ ...fakeAddon, slug });

    const root = render({ addon });

    expect(root.find('.SearchResult-link')).toHaveProp('to', getAddonURL(slug));
  });

  it('stops propagation when clicking on the add-on name', () => {
    const root = render();

    const clickEvent = createFakeEvent();
    root.find('.SearchResult-link').simulate('click', clickEvent);

    sinon.assert.called(clickEvent.stopPropagation);
  });

  it('links the heading to the detail page with UTM params', () => {
    const addonInstallSource = 'home-page-featured';

    const root = render({ addonInstallSource });

    const link = root.find('.SearchResult-link');
    expect(url.parse(link.prop('to'), true).query).toMatchObject({
      utm_source: DEFAULT_UTM_SOURCE,
      utm_content: addonInstallSource,
    });
  });

  it('renders the author', () => {
    const root = render();

    expect(root.find('.SearchResult-author')).toIncludeText(
      'A funky déveloper',
    );
  });

  it('ignores an empty author list', () => {
    const root = render({
      addon: createInternalAddonWithLang({ ...fakeAddon, authors: undefined }),
    });

    expect(root).not.toHaveClassName('SearchResult-author');
  });

  it("renders only the first author's name when there are multiple", () => {
    const root = render();

    expect(root.find('.SearchResult-author')).toIncludeText(
      'A funky déveloper',
    );
    expect(root.find('.SearchResult-author')).not.toIncludeText(
      'A groovy developer',
    );
  });

  it('renders the user count', () => {
    const root = render({ addon: { ...baseAddon, average_daily_users: 6233 } });

    expect(root.find('.SearchResult-users')).toIncludeText('6,233 users');
  });

  it('localises the user count', () => {
    const root = render({
      addon: { ...baseAddon, average_daily_users: 6233 },
      lang: 'fr',
    });

    expect(
      normalizeSpaces(root.find('.SearchResult-users-text').text()),
    ).toContain('6 233');
  });

  it('renders the user count as singular', () => {
    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        average_daily_users: 1,
      }),
    });

    expect(root.find('.SearchResult-users')).toIncludeText('1 user');
  });

  it('links the li element to the detail page', () => {
    const slug = 'some-addon-slug';
    const addon = createInternalAddonWithLang({ ...fakeAddon, slug });
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr';
    const history = createFakeHistory();
    const { store } = dispatchClientMetadata({ clientApp, lang });

    const root = render({ addon, history, store });

    const onClick = root.find('.SearchResult').prop('onClick');
    onClick();

    sinon.assert.calledWith(
      history.push,
      `/${lang}/${clientApp}${getAddonURL(slug)}`,
    );
  });

  it('calls the custom onClick handler for the li element, passing the addon', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const onClick = sinon.spy();

    const root = render({ addon, onClick });

    const clickHandler = root.find('.SearchResult').prop('onClick');
    clickHandler();

    sinon.assert.calledWith(onClick, addon);
  });

  it('does not call the custom onClick handler for the li element without an addon', () => {
    const onClick = sinon.spy();

    const root = render({ noAddon: true, onClick });

    const clickHandler = root.find('.SearchResult').prop('onClick');
    clickHandler();

    sinon.assert.notCalled(onClick);
  });

  it('calls the custom onClick handler for the anchor element, passing the addon', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const clickEvent = createFakeEvent();
    const onClick = sinon.spy();

    const root = render({ addon, onClick });

    const clickHandler = root.find('.SearchResult-link').prop('onClick');
    clickHandler(clickEvent);

    sinon.assert.calledWith(onClick, addon);
  });

  it('does not call the custom onClick handler for the anchor element without an addon', () => {
    const onClick = sinon.spy();

    const root = render({ noAddon: true, onClick });

    const clickHandler = root.find('.SearchResult').prop('onClick');
    clickHandler();

    sinon.assert.notCalled(onClick);
  });

  it('calls the custom onImpression handler, passing the addon', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const onImpression = sinon.spy();

    render({ addon, onImpression });

    sinon.assert.calledWith(onImpression, addon);
  });

  it('does not call the custom onImpression handler without an addon', () => {
    const onImpression = sinon.spy();

    render({ noAddon: true, onImpression });

    sinon.assert.notCalled(onImpression);
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
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      icon_url: 'whatevs',
    });
    const root = render({ addon });

    // image `require` calls in jest return the filename
    expect(root.find('.SearchResult-icon')).toHaveProp('src', 'default-64.png');
  });

  it('adds a theme-specific class', () => {
    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
      }),
    });

    expect(root).toHaveClassName('SearchResult--theme');
  });

  it('adds a theme-specific class when useThemePlaceholder is true and it is loading', () => {
    const root = render({ noAddon: true, useThemePlaceholder: true });

    expect(root).toHaveClassName('SearchResult--theme');
  });

  it('does not render a theme image if the isAllowedOrigin is false', () => {
    const root = render({
      _isAllowedOrigin: sinon.stub().returns(false),
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        previews: [],
        type: ADDON_TYPE_STATIC_THEME,
      }),
    });

    expect(root.find('.SearchResult-icon')).toHaveLength(0);
  });

  it("renders an image's alt attribute as its addon name", () => {
    const alt = 'pretty image';
    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        name: createLocalizedString(alt),
      }),
    });

    expect(root.find('.SearchResult-icon')).toHaveProp('alt', alt);
  });

  it('renders an empty string for the image alt tag while there is no addon', () => {
    const root = render({ noAddon: true });

    expect(root.find('.SearchResult-icon')).toHaveProp('alt', '');
  });

  it('renders a loading class name while there is no addon', () => {
    const root = render({ noAddon: true });

    expect(root.find('.SearchResult-icon')).toHaveClassName(
      '.SearchResult-icon--loading',
    );
  });

  it('displays the thumbnail image as the default src for static theme', () => {
    const headerImageThumb = 'https://addons.cdn.mozilla.net/thumb/12345.png';

    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
        previews: [
          {
            ...fakePreview,
            thumbnail_url: headerImageThumb,
          },
        ],
      }),
    });
    const image = root.find('.SearchResult-icon');

    expect(image.prop('src')).toEqual(headerImageThumb);
  });

  it('displays the full preview for static theme when showFullSizePreview: true', () => {
    const headerImageFull = 'https://addons.cdn.mozilla.net/full/12345.png';

    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
        previews: [
          {
            ...fakePreview,
            image_url: headerImageFull,
          },
        ],
      }),
      showFullSizePreview: true,
    });
    const image = root.find('.SearchResult-icon');

    expect(image.prop('src')).toEqual(headerImageFull);
  });

  it('displays a fallback image for themes that only have 1 preview option', () => {
    const headerImageThumb = 'https://addons.cdn.mozilla.net/thumb/12345.png';

    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
        previews: [
          {
            ...fakePreview,
            thumbnail_url: headerImageThumb,
          },
        ],
      }),
    });
    const image = root.find('.SearchResult-icon');

    expect(image.prop('src')).toEqual(headerImageThumb);
  });

  it('displays a message if the static theme preview image is unavailable', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      previews: [],
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });

    expect(root.find('.SearchResult-notheme')).toIncludeText(
      'No theme preview available',
    );
  });

  it("does not display a 'no theme preview available' message if the static theme preview image is available", () => {
    const addon = createInternalAddonWithLang({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });

    expect(root.find('.SearchResult-result')).not.toIncludeText(
      'No theme preview available',
    );
  });

  it('renders placeholders without an addon', () => {
    const root = render({ noAddon: true });

    // Since there's no add-on, there shouldn't be a link.
    expect(root.find('.SearchResult-link')).toHaveLength(0);

    expect(root.find('.SearchResult-icon')).toHaveProp('src', 'default-64.png');
    expect(root.find('.SearchResult-name').find(LoadingText)).toHaveLength(1);
    expect(root.find('.SearchResult-summary').find(LoadingText)).toHaveLength(
      1,
    );
    expect(root.find(Rating)).toHaveProp('rating', 0);
    expect(root.find('.SearchResult-author').find(LoadingText)).toHaveLength(1);
    expect(
      root.find('.SearchResult-users-text').find(LoadingText),
    ).toHaveLength(1);
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
    expect(note.find('.SearchResult-note-header')).toIncludeText('Add-on note');
    const expectedHTML = `<p class="SearchResult-note-content">${notes}</p>`;
    expect(note.find('.SearchResult-note-content')).toHaveHTML(expectedHTML);
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
    expect(note.find('.SearchResult-note-header')).toIncludeText('Add-on note');
    const expectedHTML =
      '<p class="SearchResult-note-content">Some<br>notes.</p>';
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

  it('displays a promoted badge when an add-on is promoted', () => {
    const category = VERIFIED;
    const root = render({
      _getPromotedCategory: sinon.stub().returns(category),
    });

    expect(root.find(PromotedBadge)).toHaveLength(1);
    expect(root.find(PromotedBadge)).toHaveProp('category', category);
  });

  it('passes an onClick function which stops propagation to PromotedBadge', () => {
    const root = render({
      _getPromotedCategory: sinon.stub().returns(VERIFIED),
    });

    const clickEvent = createFakeEvent();
    root.find(PromotedBadge).simulate('click', clickEvent);

    sinon.assert.called(clickEvent.stopPropagation);
  });

  it('does not display a promoted badge when showPromotedBadge is false', () => {
    const root = render({
      _getPromotedCategory: sinon.stub().returns(VERIFIED),
      showPromotedBadge: false,
    });

    expect(root.find(PromotedBadge)).toHaveLength(0);
  });

  it('does not display a promoted badge when the addon is not promoted', () => {
    const root = render({
      _getPromotedCategory: sinon.stub().returns(null),
    });

    expect(root.find(PromotedBadge)).toHaveLength(0);
  });

  it('sets an extra css class to the icon wrapper when there is no theme image', () => {
    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
        previews: [],
      }),
    });

    expect(root.find('.SearchResult-icon-wrapper')).toHaveLength(1);
    expect(
      root.find('.SearchResult-icon-wrapper--no-theme-image'),
    ).toHaveLength(1);
  });

  it('sets an extra css class to the icon wrapper when there is no add-on and we want to use a theme placeholder', () => {
    const root = render({ noAddon: true, useThemePlaceholder: true });

    expect(root.find('.SearchResult-icon-wrapper')).toHaveLength(1);
    expect(
      root.find('.SearchResult-icon-wrapper--no-theme-image'),
    ).toHaveLength(1);
  });

  it('does not set an extra css class to the icon wrapper when there is no add-on and we do not want to use a theme placeholder', () => {
    const root = render({ noAddon: true, useThemePlaceholder: false });

    expect(root.find('.SearchResult-icon-wrapper')).toHaveLength(1);
    expect(
      root.find('.SearchResult-icon-wrapper--no-theme-image'),
    ).toHaveLength(0);
  });

  it('renders a "notheme" placeholder when there is no add-on and we want to use a theme placeholder', () => {
    const root = render({ noAddon: true, useThemePlaceholder: true });

    expect(root.find('.SearchResult-notheme')).toIncludeText(
      'No theme preview available',
    );
  });

  it('does not render a "notheme" placeholder when there is no add-on and we do not want to use a theme placeholder', () => {
    const root = render({ noAddon: true, useThemePlaceholder: false });

    expect(root.find('.SearchResult-notheme')).not.toIncludeText(
      'No theme preview available',
    );
  });
});
