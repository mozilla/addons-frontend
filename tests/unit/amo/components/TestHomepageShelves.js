import { shallow } from 'enzyme';
import * as React from 'react';

import {
  HOMESHELVES_ENDPOINT_COLLECTIONS,
  HOMESHELVES_ENDPOINT_SEARCH,
  HOMESHELVES_ENDPOINT_RANDOM_TAG,
  HomepageShelvesBase,
} from 'amo/components/HomepageShelves';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_TAG_SHELF,
} from 'amo/constants';
import { createInternalShelf } from 'amo/reducers/home';
import {
  DEFAULT_LANG_IN_TESTS,
  createLocalizedString,
  fakeI18n,
  fakeExternalShelf,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(
      <HomepageShelvesBase i18n={fakeI18n()} shelves={[]} {...props} />,
    );
  };

  const _createShelf = (overrides = {}) =>
    createInternalShelf(
      {
        ...fakeExternalShelf,
        ...overrides,
      },
      DEFAULT_LANG_IN_TESTS,
    );

  it('renders shelves in a loading state', () => {
    const root = render({ loading: true });

    const loadingCards = root.find('.HomepageShelves-loading-card');
    expect(loadingCards).toHaveLength(3);
    loadingCards.forEach((card) => {
      expect(card).toHaveProp('loading', true);
    });
  });

  it('renders shelves in a loaded state', () => {
    const shelf1FooterText = 'Footer Text 1';
    const shelf2FooterText = 'Footer Text 2';
    const shelf1Title = 'First Shelf';
    const shelf2Title = 'Second Shelf';
    const shelf1 = _createShelf({
      addons: [{ ...fakeAddon, slug: 'slug1' }],
      endpoint: HOMESHELVES_ENDPOINT_SEARCH,
      addonType: ADDON_TYPE_EXTENSION,
      footer: {
        url: '/1',
        outgoing: '/1',
        text: createLocalizedString(shelf1FooterText),
      },
      title: createLocalizedString(shelf1Title),
      url: 'https://addons.mozilla.org/1',
    });

    const shelf2 = _createShelf({
      addons: [{ ...fakeAddon, slug: 'slug2' }],
      endpoint: HOMESHELVES_ENDPOINT_SEARCH,
      addonType: ADDON_TYPE_STATIC_THEME,
      footer: {
        url: '/2',
        outgoing: '/2',
        text: createLocalizedString(shelf2FooterText),
      },
      title: createLocalizedString(shelf2Title),
      url: 'https://addons.mozilla.org/2',
    });

    const root = render({ shelves: [shelf1, shelf2] });

    const landingCards = root.find(LandingAddonsCard);
    expect(landingCards).toHaveLength(2);

    const card1 = landingCards.at(0);
    expect(card1).toHaveProp('addons', shelf1.addons);
    expect(card1).toHaveProp('footerText', shelf1FooterText);
    expect(card1).toHaveProp('footerLink', shelf1.footer.url);
    expect(card1).toHaveProp('header', shelf1Title);
    expect(card1).not.toHaveProp('loading');
    expect(card1).toHaveClassName('Home-First-Shelf');

    const card2 = landingCards.at(1);
    expect(card2).toHaveProp('addons', shelf2.addons);
    expect(card2).toHaveProp('footerText', shelf2FooterText);
    expect(card2).toHaveProp('footerLink', shelf2.footer.url);
    expect(card2).toHaveProp('header', shelf2Title);
    expect(card2).not.toHaveProp('loading');
    expect(card2).toHaveClassName('Home-Second-Shelf');
  });

  it.each([
    [false, ADDON_TYPE_EXTENSION],
    [true, ADDON_TYPE_STATIC_THEME],
  ])('passes isTheme as %s when addon type is %s', (isTheme, addon_type) => {
    const root = render({
      shelves: [_createShelf({ addon_type })],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp('isTheme', isTheme);
  });

  it.each([
    [4, ADDON_TYPE_EXTENSION],
    [3, ADDON_TYPE_STATIC_THEME],
  ])(
    'passes placeholderCount as %s when addon type is %s',
    (placeholderCount, addon_type) => {
      const root = render({
        shelves: [_createShelf({ addon_type })],
      });

      expect(root.find(LandingAddonsCard)).toHaveProp(
        'placeholderCount',
        placeholderCount,
      );
    },
  );

  it.each([
    [INSTALL_SOURCE_FEATURED_COLLECTION, HOMESHELVES_ENDPOINT_COLLECTIONS],
    [INSTALL_SOURCE_FEATURED, HOMESHELVES_ENDPOINT_SEARCH],
  ])(
    'passes addonInstallSource as %s when endpoint is %s',
    (addonInstallSource, endpoint) => {
      const root = render({
        shelves: [_createShelf({ endpoint })],
      });

      expect(root.find(LandingAddonsCard)).toHaveProp(
        'addonInstallSource',
        addonInstallSource,
      );
    },
  );

  it('passes addonInstallSource as tag-shelf-{tag} when endpoint is random-tag', () => {
    const url =
      'https://addons-dev.allizom.org/api/v5/addons/search/?sort=rating&tag=foo';
    const root = render({
      shelves: [
        _createShelf({ url, endpoint: HOMESHELVES_ENDPOINT_RANDOM_TAG }),
      ],
    });

    const addonInstallSource = INSTALL_SOURCE_TAG_SHELF.replace(
      '{tagName}',
      'foo',
    );
    expect(root.find(LandingAddonsCard)).toHaveProp(
      'addonInstallSource',
      addonInstallSource,
    );
  });

  it('passes isHomepageShelf to LandingAddonsCard', () => {
    const root = render({
      isHomepageShelf: true,
      shelves: [_createShelf()],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp('isHomepageShelf', true);
  });

  it('generates a default footerText', () => {
    const title = 'Shelf Title';
    const root = render({
      shelves: [
        _createShelf({
          footer: { ...fakeExternalShelf.footer, text: '' },
          title: createLocalizedString(title),
        }),
      ],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp(
      'footerText',
      `See more ${title.toLowerCase()}`,
    );
  });

  it('passes an object with an href for an external link', () => {
    const _checkInternalURL = sinon.stub().returns({ isInternal: false });
    const url = 'link';
    const root = render({
      _checkInternalURL,
      shelves: [
        _createShelf({
          footer: { ...fakeExternalShelf.footer, url },
        }),
      ],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp('footerLink', {
      href: url,
    });
    sinon.assert.calledWith(_checkInternalURL, { urlString: url });
  });

  it('passes a relative URL for an internal link', () => {
    const url = 'https://some.internal/url';
    const fixedURL = '/url';
    const _checkInternalURL = sinon
      .stub()
      .returns({ isInternal: true, relativeURL: fixedURL });
    const root = render({
      _checkInternalURL,
      shelves: [
        _createShelf({
          footer: { ...fakeExternalShelf.footer, url },
        }),
      ],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp('footerLink', fixedURL);
    sinon.assert.calledWith(_checkInternalURL, { urlString: url });
  });
});
