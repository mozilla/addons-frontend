import config from 'config';
import { shallow } from 'enzyme';
import * as React from 'react';

import {
  HOMESHELVES_ENDPOINT_COLLECTIONS,
  HOMESHELVES_ENDPOINT_SEARCH,
  HOMESHELVES_ENDPOINT_SEARCH_THEMES,
  HomepageShelvesBase,
} from 'amo/components/HomepageShelves';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  INSTALL_SOURCE_FEATURED_COLLECTION,
  INSTALL_SOURCE_FEATURED,
} from 'amo/constants';
import { createInternalShelf } from 'amo/reducers/home';
import {
  DEFAULT_LANG_IN_TESTS,
  createLocalizedString,
  fakeI18n,
  fakeShelf,
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
        ...fakeShelf,
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
      criteria: '?sort=rating',
      endpoint: HOMESHELVES_ENDPOINT_SEARCH,
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
      criteria: '?sort=users',
      endpoint: HOMESHELVES_ENDPOINT_SEARCH_THEMES,
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
    [false, HOMESHELVES_ENDPOINT_COLLECTIONS],
    [false, HOMESHELVES_ENDPOINT_SEARCH],
    [true, HOMESHELVES_ENDPOINT_SEARCH_THEMES],
  ])('passes isTheme as %s when endpoint is %s', (isTheme, endpoint) => {
    const root = render({
      shelves: [_createShelf({ endpoint })],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp('isTheme', isTheme);
  });

  it.each([
    [4, HOMESHELVES_ENDPOINT_COLLECTIONS],
    [4, HOMESHELVES_ENDPOINT_SEARCH],
    [3, HOMESHELVES_ENDPOINT_SEARCH_THEMES],
  ])(
    'passes placeholderCount as %s when endpoint is %s',
    (placeholderCount, endpoint) => {
      const root = render({
        shelves: [_createShelf({ endpoint })],
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
    [INSTALL_SOURCE_FEATURED, HOMESHELVES_ENDPOINT_SEARCH_THEMES],
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

  it('generates a default footerText', () => {
    const title = 'Shelf Title';
    const root = render({
      shelves: [
        _createShelf({
          footer: { ...fakeShelf.footer, text: '' },
          title: createLocalizedString(title),
        }),
      ],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp(
      'footerText',
      `See more ${title.toLowerCase()}`,
    );
  });

  it('adds a leading slash to footerLink if needed', () => {
    const url = 'link';
    const root = render({
      shelves: [
        _createShelf({
          footer: { ...fakeShelf.footer, url },
        }),
      ],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp('footerLink', `/${url}`);
  });

  it('generates a default footerLink for a collection', () => {
    const slug = 'some-collection-slug';
    const root = render({
      shelves: [
        _createShelf({
          criteria: slug,
          endpoint: HOMESHELVES_ENDPOINT_COLLECTIONS,
          footer: { ...fakeShelf.footer, url: '' },
        }),
      ],
    });

    expect(root.find(LandingAddonsCard)).toHaveProp(
      'footerLink',
      `/collections/${config.get('mozillaUserId')}/${slug}/`,
    );
  });

  it.each([HOMESHELVES_ENDPOINT_SEARCH, HOMESHELVES_ENDPOINT_SEARCH_THEMES])(
    'generates a default footerLink for %s',
    (endpoint) => {
      const criteria = '?sort=users';
      const root = render({
        shelves: [
          _createShelf({
            criteria,
            endpoint,
            footer: { ...fakeShelf.footer, url: '' },
          }),
        ],
      });

      expect(root.find(LandingAddonsCard)).toHaveProp(
        'footerLink',
        `/search/${criteria}`,
      );
    },
  );
});
