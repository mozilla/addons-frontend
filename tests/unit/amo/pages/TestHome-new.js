import userEvent from '@testing-library/user-event';

import {
  HOMESHELVES_ENDPOINT_COLLECTIONS,
  HOMESHELVES_ENDPOINT_SEARCH,
  HOMESHELVES_ENDPOINT_RANDOM_TAG,
} from 'amo/components/HomepageShelves';
import {
  SECONDARY_HERO_CLICK_ACTION,
  SECONDARY_HERO_CLICK_CATEGORY,
  SECONDARY_HERO_SRC,
  makeCallToActionURL,
} from 'amo/components/SecondaryHero';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_MEDIUM,
  DEFAULT_UTM_SOURCE,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_TAG_SHELF_PREFIX,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { loadHomeData } from 'amo/reducers/home';
import tracking from 'amo/tracking';
import { checkInternalURL, stripLangFromAmoUrl } from 'amo/utils';
import { addQueryParams } from 'amo/utils/url';
import {
  createHistory,
  createHomeShelves,
  createLocalizedString,
  createPrimaryHeroShelf,
  dispatchClientMetadata,
  fakeAddon,
  fakeExternalShelf,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

jest.mock('amo/utils', () => ({
  ...jest.requireActual('amo/utils'),
  checkInternalURL: jest.fn().mockReturnValue({ isInternal: false }),
  stripLangFromAmoUrl: jest.fn((urlString) => urlString),
}));

jest.mock('amo/tracking', () => ({
  ...jest.requireActual('amo/tracking'),
  sendEvent: jest.fn(),
}));

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  const defaultLocation = `/${lang}/${clientApp}/`;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = ({ location = defaultLocation } = {}) => {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location],
      }),
      store,
    };

    return defaultRender(renderOptions);
  };

  const _createHomeShelves = ({
    primaryProps = { addon: fakeAddon },
    resultsProps = [fakeExternalShelf],
    secondaryProps = {},
  } = {}) => {
    return createHomeShelves({ resultsProps, primaryProps, secondaryProps });
  };

  const _loadHomeData = ({
    homeShelves,
    primaryProps = { addon: fakeAddon },
    resultsProps = [fakeExternalShelf],
    secondaryProps = {},
    shelves = {},
  } = {}) => {
    store.dispatch(
      loadHomeData({
        homeShelves:
          homeShelves ||
          _createHomeShelves({
            primaryProps,
            resultsProps,
            secondaryProps,
          }),
        shelves,
      }),
    );
  };

  const renderWithHomeData = ({
    homeShelves,
    primaryProps = { addon: fakeAddon },
    resultsProps = [fakeExternalShelf],
    secondaryProps = {},
    shelves = {},
  } = {}) => {
    _loadHomeData({
      homeShelves,
      primaryProps,
      resultsProps,
      secondaryProps,
      shelves,
    });
    render();
  };

  describe('Tests for SecondaryHero', () => {
    it('renders a message with an internal link', () => {
      const cta = { text: 'cta text', url: '/some/url', outgoing: '/out/url' };
      checkInternalURL.mockReturnValue({
        isInternal: true,
        relativeURL: cta.url,
      });
      const description = 'A description';
      const headline = 'A Headline';

      renderWithHomeData({ secondaryProps: { cta, description, headline } });

      expect(
        screen.getByRole('heading', { name: headline }),
      ).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();

      const link = screen.getByRole('link', { name: cta.text });
      expect(link).toHaveAttribute(
        'href',
        `/${lang}/${clientApp}${addQueryParams(cta.url, {
          utm_source: DEFAULT_UTM_SOURCE,
          utm_medium: DEFAULT_UTM_MEDIUM,
          utm_content: SECONDARY_HERO_SRC,
        })}`,
      );
      expect(link).not.toHaveAttribute('target');
      expect(checkInternalURL).toHaveBeenCalledWith({ urlString: cta.url });
    });

    it('renders a message with an external link', () => {
      checkInternalURL.mockReturnValue({ isInternal: false });
      const cta = { text: 'cta text', url: '/some/url', outgoing: '/out/url' };

      renderWithHomeData({ secondaryProps: { cta } });

      const link = screen.getByRole('link', { name: cta.text });
      expect(link).toHaveAttribute(
        'href',
        addQueryParams(cta.url, {
          utm_source: DEFAULT_UTM_SOURCE,
          utm_medium: DEFAULT_UTM_MEDIUM,
          utm_content: SECONDARY_HERO_SRC,
        }),
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(checkInternalURL).toHaveBeenCalledWith({ urlString: cta.url });
    });

    it('renders a message without a link', () => {
      const headline = 'A Headline';
      renderWithHomeData({ secondaryProps: { cta: null, headline } });

      expect(
        screen.getByRole('heading', { name: headline }),
      ).toBeInTheDocument();
      expect(
        // eslint-disable-next-line testing-library/prefer-presence-queries
        within(screen.getByClassName('SecondaryHero-message')).queryByRole(
          'link',
        ),
      ).not.toBeInTheDocument();
    });

    it('sends a tracking event when the cta is clicked', () => {
      const strippedUrl = '/a/different/url';
      stripLangFromAmoUrl.mockReturnValue(strippedUrl);
      const cta = { text: 'cta text', url: '/some/url', outgoing: '/out/url' };
      renderWithHomeData({ secondaryProps: { cta } });

      tracking.sendEvent.mockClear();
      userEvent.click(screen.getByRole('link', { name: cta.text }));

      expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
      expect(tracking.sendEvent).toHaveBeenCalledWith({
        action: SECONDARY_HERO_CLICK_ACTION,
        category: SECONDARY_HERO_CLICK_CATEGORY,
        label: strippedUrl,
      });
    });

    it('renders in a loading state', () => {
      render();

      expect(
        within(screen.getByClassName('SecondaryHero')).getAllByRole('alert'),
      ).toHaveLength(11);
    });

    it('renders nothing if shelfData is null', () => {
      renderWithHomeData({
        homeShelves: {
          results: [fakeExternalShelf],
          primary: createPrimaryHeroShelf(),
          secondary: null,
        },
      });

      expect(screen.queryByClassName('SecondaryHero')).not.toBeInTheDocument();
    });

    describe('modules', () => {
      const module1 = {
        icon: 'icon1',
        description: 'module1 description',
        cta: { text: 'cta1 text', url: '/cta/url1', outgoing: '/out/url1' },
      };
      const module2 = {
        icon: 'icon2',
        description: 'module2 description',
        cta: null,
      };
      const module3 = {
        icon: 'icon3',
        description: 'module3 description',
        cta: { text: 'cta3 text', url: '/cta/url3', outgoing: '/out/url3' },
      };

      const secondaryPropsWithModules = {
        modules: [module1, module2, module3],
      };

      it.each([
        [0, 'internal', module1],
        [1, 'undefined', module2],
        [2, 'external', module3],
      ])(
        'renders the module at position "%s" with an %s link',
        (moduleIndex, linkType, moduleData) => {
          checkInternalURL.mockReturnValue({
            isInternal: linkType === 'internal',
            relativeURL: moduleData.cta && moduleData.cta.url,
          });
          renderWithHomeData({ secondaryProps: secondaryPropsWithModules });

          const module = screen.getAllByClassName('SecondaryHero-module')[
            moduleIndex
          ];
          expect(screen.getByAltText(moduleData.description)).toHaveAttribute(
            'src',
            moduleData.icon,
          );
          expect(screen.getByText(moduleData.description)).toBeInTheDocument();
          expect(within(module).queryAllByRole('link')).toHaveLength(
            moduleData.cta ? 1 : 0,
          );

          if (moduleData.cta) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(checkInternalURL).toHaveBeenCalledWith({
              urlString: moduleData.cta.url,
            });

            const link = screen.getByRole('link', {
              name: moduleData.cta.text,
            });

            if (linkType === 'external') {
              // eslint-disable-next-line jest/no-conditional-expect
              expect(link).toHaveAttribute(
                'href',
                addQueryParams(moduleData.cta.url, {
                  utm_source: DEFAULT_UTM_SOURCE,
                  utm_medium: DEFAULT_UTM_MEDIUM,
                  utm_content: SECONDARY_HERO_SRC,
                }),
              );
              // eslint-disable-next-line jest/no-conditional-expect
              expect(link).toHaveAttribute('target', '_blank');
            } else if (linkType === 'internal') {
              // eslint-disable-next-line jest/no-conditional-expect
              expect(link).toHaveAttribute(
                'href',
                `/${lang}/${clientApp}${addQueryParams(moduleData.cta.url, {
                  utm_source: DEFAULT_UTM_SOURCE,
                  utm_medium: DEFAULT_UTM_MEDIUM,
                  utm_content: SECONDARY_HERO_SRC,
                })}`,
              );
              // eslint-disable-next-line jest/no-conditional-expect
              expect(link).not.toHaveAttribute('target');
            }
          }
        },
      );

      it('sends a tracking event when the cta is clicked', () => {
        const strippedUrl = '/a/different/url';
        stripLangFromAmoUrl.mockReturnValue(strippedUrl);
        renderWithHomeData({ secondaryProps: secondaryPropsWithModules });

        tracking.sendEvent.mockClear();
        userEvent.click(screen.getByRole('link', { name: module1.cta.text }));

        expect(stripLangFromAmoUrl).toHaveBeenCalledWith({
          urlString: expect.stringContaining(
            makeCallToActionURL(module1.cta.url),
          ),
        });
        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(tracking.sendEvent).toHaveBeenCalledWith({
          action: SECONDARY_HERO_CLICK_ACTION,
          category: SECONDARY_HERO_CLICK_CATEGORY,
          label: strippedUrl,
        });
      });
    });
  });

  describe('Tests for HomepageShelves', () => {
    it('renders shelves in a loading state', () => {
      render();

      const loadingShelves = screen.getAllByClassName(
        'HomepageShelves-loading-card',
      );
      expect(loadingShelves).toHaveLength(3);
      loadingShelves.forEach((shelf) => {
        expect(within(shelf).getAllByRole('alert')).toHaveLength(17);
      });
    });

    it('renders shelves in a loaded state', () => {
      const shelf1AddonName = 'Addon for Shelf 1';
      const shelf2AddonName = 'Addon for Shelf 2';
      const shelf1FooterText = 'Footer Text 1';
      const shelf2FooterText = 'Footer Text 2';
      const shelf1Title = 'First Shelf';
      const shelf2Title = 'Second Shelf';
      const shelf1Data = {
        ...fakeExternalShelf,
        addons: new Array(LANDING_PAGE_EXTENSION_COUNT).fill({
          ...fakeAddon,
          name: createLocalizedString(shelf1AddonName),
          slug: 'slug1',
        }),
        endpoint: HOMESHELVES_ENDPOINT_SEARCH,
        addon_type: ADDON_TYPE_EXTENSION,
        footer: {
          url: '/1',
          outgoing: '/1',
          text: createLocalizedString(shelf1FooterText),
        },
        title: createLocalizedString(shelf1Title),
        url: 'https://addons.mozilla.org/1',
      };

      const shelf2Data = {
        ...fakeExternalShelf,
        addons: new Array(LANDING_PAGE_THEME_COUNT).fill({
          ...fakeAddon,
          name: createLocalizedString(shelf2AddonName),
          slug: 'slug2',
          type: ADDON_TYPE_STATIC_THEME,
        }),
        endpoint: HOMESHELVES_ENDPOINT_SEARCH,
        addon_type: ADDON_TYPE_STATIC_THEME,
        footer: {
          url: '/2',
          outgoing: '/2',
          text: createLocalizedString(shelf2FooterText),
        },
        title: createLocalizedString(shelf2Title),
        url: 'https://addons.mozilla.org/2',
      };

      renderWithHomeData({ resultsProps: [shelf1Data, shelf2Data] });

      const shelves = screen.getAllByClassName('LandingAddonsCard');
      expect(shelves).toHaveLength(2);

      const shelf1 = shelves[0];
      expect(
        within(shelf1).getAllByRole('link', { name: shelf1AddonName }),
      ).toHaveLength(LANDING_PAGE_EXTENSION_COUNT);
      let footerLinks = within(shelf1).getAllByRole('link', {
        name: shelf1FooterText,
      });
      expect(footerLinks).toHaveLength(2);
      expect(footerLinks[0]).toHaveAttribute('href', shelf1Data.footer.url);
      expect(within(shelf1).getByText(shelf1Title)).toBeInTheDocument();
      expect(within(shelf1).queryByRole('alert')).not.toBeInTheDocument();
      expect(shelf1).toHaveClass('Home-First-Shelf');
      expect(shelf1).not.toHaveClass('LandingAddonsCard-Themes');
      // Verifying that isHomePage is passed to Card.
      expect(
        within(shelf1).getByClassName('Card-shelf-header'),
      ).toBeInTheDocument();
      expect(
        within(shelf1).getByClassName('Card-shelf-footer-in-header'),
      ).toBeInTheDocument();

      const shelf2 = shelves[1];
      expect(
        within(shelf2).getAllByRole('link', { name: shelf2AddonName }),
      ).toHaveLength(LANDING_PAGE_THEME_COUNT);
      footerLinks = within(shelf2).getAllByRole('link', {
        name: shelf2FooterText,
      });
      expect(footerLinks).toHaveLength(2);
      expect(footerLinks[0]).toHaveAttribute('href', shelf2Data.footer.url);
      expect(within(shelf2).getByText(shelf2Title)).toBeInTheDocument();
      expect(within(shelf2).queryByRole('alert')).not.toBeInTheDocument();
      expect(shelf2).toHaveClass('Home-Second-Shelf');
      expect(shelf2).toHaveClass('LandingAddonsCard-Themes');
      expect(
        within(shelf1).getByClassName('Card-shelf-header'),
      ).toBeInTheDocument();
      expect(
        within(shelf1).getByClassName('Card-shelf-footer-in-header'),
      ).toBeInTheDocument();
    });

    it.each([
      [INSTALL_SOURCE_FEATURED_COLLECTION, HOMESHELVES_ENDPOINT_COLLECTIONS],
      [INSTALL_SOURCE_FEATURED, HOMESHELVES_ENDPOINT_SEARCH],
    ])(
      'passes addonInstallSource as %s when endpoint is %s',
      (addonInstallSource, endpoint) => {
        const addonName = 'Some add-on name';
        const slug = 'some-slug';
        renderWithHomeData({
          resultsProps: [
            {
              ...fakeExternalShelf,
              addons: [
                { ...fakeAddon, name: createLocalizedString(addonName), slug },
              ],
              endpoint,
            },
          ],
        });

        expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
          'href',
          [
            `/${lang}/${clientApp}/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
            `utm_medium=${DEFAULT_UTM_MEDIUM}`,
            `utm_content=${addonInstallSource}`,
          ].join('&'),
        );
      },
    );

    it('passes addonInstallSource as tag-shelf-{tag} when endpoint is random-tag', () => {
      const tagName = 'foo';
      const url = `https://addons-dev.allizom.org/api/v5/addons/search/?sort=rating&tag=${tagName}`;
      const addonName = 'Some add-on name';
      const slug = 'some-slug';
      renderWithHomeData({
        resultsProps: [
          {
            ...fakeExternalShelf,
            addons: [
              { ...fakeAddon, name: createLocalizedString(addonName), slug },
            ],
            endpoint: HOMESHELVES_ENDPOINT_RANDOM_TAG,
            url,
          },
        ],
      });

      expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
        'href',
        [
          `/${lang}/${clientApp}/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
          `utm_medium=${DEFAULT_UTM_MEDIUM}`,
          `utm_content=${INSTALL_SOURCE_TAG_SHELF_PREFIX}${tagName}`,
        ].join('&'),
      );
    });

    it('generates a default footerText', () => {
      const title = 'Shelf Title';
      renderWithHomeData({
        resultsProps: [
          {
            ...fakeExternalShelf,
            addons: new Array(LANDING_PAGE_EXTENSION_COUNT).fill(fakeAddon),
            addon_type: ADDON_TYPE_EXTENSION,
            footer: { ...fakeExternalShelf.footer, text: '' },
            title: createLocalizedString(title),
          },
        ],
      });

      expect(
        screen.getAllByRole('link', {
          name: `See more ${title.toLowerCase()}`,
        }),
      ).toHaveLength(2);
    });

    it('passes an object with an href for an external link', () => {
      checkInternalURL.mockReturnValue({ isInternal: false });
      const text = 'Some footer text';
      const url = '/some/link';
      renderWithHomeData({
        resultsProps: [
          {
            ...fakeExternalShelf,
            addons: new Array(LANDING_PAGE_EXTENSION_COUNT).fill(fakeAddon),
            addon_type: ADDON_TYPE_EXTENSION,
            footer: {
              ...fakeExternalShelf.footer,
              text: createLocalizedString(text),
              url,
            },
          },
        ],
      });

      expect(screen.getAllByRole('link', { name: text })[0]).toHaveAttribute(
        'href',
        url,
      );
      expect(checkInternalURL).toHaveBeenCalledWith({ urlString: url });
    });

    it('passes a relative URL for an internal link', () => {
      const fixedURL = '/some/url';
      checkInternalURL.mockReturnValue({
        isInternal: true,
        relativeURL: fixedURL,
      });
      const text = 'Some footer text';
      const url = 'https://some.internal/url';
      renderWithHomeData({
        resultsProps: [
          {
            ...fakeExternalShelf,
            addons: new Array(LANDING_PAGE_EXTENSION_COUNT).fill(fakeAddon),
            addon_type: ADDON_TYPE_EXTENSION,
            footer: {
              ...fakeExternalShelf.footer,
              text: createLocalizedString(text),
              url,
            },
          },
        ],
      });

      expect(screen.getAllByRole('link', { name: text })[0]).toHaveAttribute(
        'href',
        `/${lang}/${clientApp}${fixedURL}`,
      );
      expect(checkInternalURL).toHaveBeenCalledWith({ urlString: url });
    });
  });
});
