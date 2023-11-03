import { LOCATION_CHANGE } from 'redux-first-history';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setViewContext } from 'amo/actions/viewContext';
import {
  PRIMARY_HERO_CLICK_ACTION,
  PRIMARY_HERO_CLICK_CATEGORY,
  PRIMARY_HERO_EXTERNAL_LABEL,
  PRIMARY_HERO_IMPRESSION_ACTION,
  PRIMARY_HERO_IMPRESSION_CATEGORY,
  PRIMARY_HERO_SRC,
} from 'amo/components/HeroRecommendation';
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
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_MEDIUM,
  DEFAULT_UTM_SOURCE,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_TAG_SHELF_PREFIX,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
  LINE,
  RECOMMENDED,
  SPONSORED,
  VIEW_CONTEXT_HOME,
  VERIFIED,
} from 'amo/constants';
import {
  FETCH_HOME_DATA,
  fetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import { loadSiteStatus } from 'amo/reducers/site';
import tracking from 'amo/tracking';
import { checkInternalURL, stripLangFromAmoUrl } from 'amo/utils';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import { addQueryParams } from 'amo/utils/url';
import {
  changeLocation,
  createAddonsApiResult,
  createFailedErrorHandler,
  createHomeShelves,
  createLocalizedString,
  createPrimaryHeroShelf,
  dispatchClientMetadata,
  fakeAddon,
  fakeExternalShelf,
  fakePrimaryHeroShelfExternalAddon,
  getElement,
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
  const defaultClientApp = CLIENT_APP_FIREFOX;
  const defaultLang = 'en-US';
  const errorHandlerId = 'Home';
  let store;
  let history;

  const getLocation = ({
    clientApp = defaultClientApp,
    lang = defaultLang,
  } = {}) => `/${lang}/${clientApp}/`;

  beforeEach(() => {
    store = dispatchClientMetadata({
      clientApp: defaultClientApp,
      lang: defaultLang,
    }).store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = ({ location = getLocation() } = {}) => {
    const renderResults = defaultRender({
      initialEntries: [location],
      store,
    });
    history = renderResults.history;
    return renderResults;
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
    location,
  } = {}) => {
    _loadHomeData({
      homeShelves,
      primaryProps,
      resultsProps,
      secondaryProps,
      shelves,
    });
    return render({ location });
  };

  const addonForPromotedCategory = (category = RECOMMENDED) => {
    return { ...fakeAddon, promoted: { category, apps: [defaultClientApp] } };
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
        `/${defaultLang}/${defaultClientApp}${addQueryParams(cta.url, {
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

    it('sends a tracking event when the cta is clicked', async () => {
      const strippedUrl = '/a/different/url';
      stripLangFromAmoUrl.mockReturnValue(strippedUrl);
      const cta = { text: 'cta text', url: '/some/url', outgoing: '/out/url' };
      renderWithHomeData({ secondaryProps: { cta } });

      tracking.sendEvent.mockClear();
      await userEvent.click(screen.getByRole('link', { name: cta.text }));

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
                `/${defaultLang}/${defaultClientApp}${addQueryParams(
                  moduleData.cta.url,
                  {
                    utm_source: DEFAULT_UTM_SOURCE,
                    utm_medium: DEFAULT_UTM_MEDIUM,
                    utm_content: SECONDARY_HERO_SRC,
                  },
                )}`,
              );
              // eslint-disable-next-line jest/no-conditional-expect
              expect(link).not.toHaveAttribute('target');
            }
          }
        },
      );

      it('sends a tracking event when the cta is clicked', async () => {
        const strippedUrl = '/a/different/url';
        stripLangFromAmoUrl.mockReturnValue(strippedUrl);
        renderWithHomeData({ secondaryProps: secondaryPropsWithModules });

        tracking.sendEvent.mockClear();
        await userEvent.click(
          screen.getByRole('link', { name: module1.cta.text }),
        );

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
            `/${defaultLang}/${defaultClientApp}/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
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
          `/${defaultLang}/${defaultClientApp}/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
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
        `/${defaultLang}/${defaultClientApp}${fixedURL}`,
      );
      expect(checkInternalURL).toHaveBeenCalledWith({ urlString: url });
    });
  });

  describe('Tests for HeroRecommendation', () => {
    describe('for an addon', () => {
      it('renders a heading', () => {
        const name = 'Addon name';
        renderWithHomeData({
          primaryProps: {
            addon: { ...fakeAddon, name: createLocalizedString(name) },
          },
        });

        expect(screen.getByRole('heading', { name })).toBeInTheDocument();
      });

      it('renders a link', () => {
        const slug = 'some-addon-slug';
        renderWithHomeData({
          primaryProps: {
            addon: { ...fakeAddon, slug },
          },
        });

        expect(
          screen.getByRole('link', { name: 'Get the extension' }),
        ).toHaveAttribute(
          'href',
          addQueryParams(`/${defaultLang}/${defaultClientApp}/addon/${slug}/`, {
            utm_source: DEFAULT_UTM_SOURCE,
            utm_medium: DEFAULT_UTM_MEDIUM,
            utm_content: PRIMARY_HERO_SRC,
          }),
        );
      });

      it.each([
        [LINE, 'BY FIREFOX'],
        [RECOMMENDED, 'RECOMMENDED'],
        [SPONSORED, 'SPONSORED'],
        [VERIFIED, 'SPONSORED'],
        ['unknown category', 'SPONSORED'],
      ])('displays the expected title for %s add-ons', (category, title) => {
        renderWithHomeData({
          primaryProps: {
            addon: addonForPromotedCategory(category),
          },
        });

        expect(screen.getByText(title)).toHaveClass(
          'HeroRecommendation-title-text',
        );
      });

      it.each([SPONSORED, VERIFIED, 'unknown category'])(
        'displays an additional link for %s add-ons',
        (category) => {
          renderWithHomeData({
            primaryProps: {
              addon: addonForPromotedCategory(category),
            },
          });

          expect(
            screen.getByRole('link', {
              name:
                `Firefox only recommends extensions that meet our ` +
                `standards for security and performance.`,
            }),
          ).toBeInTheDocument();
        },
      );

      it('does not display an additional link when loading', () => {
        render();

        expect(
          screen.queryByRole('link', {
            name:
              `Firefox only recommends extensions that meet our ` +
              `standards for security and performance.`,
          }),
        ).not.toBeInTheDocument();
      });

      it.each([LINE, RECOMMENDED])(
        'does not display an additional link for %s add-ons',
        (category) => {
          renderWithHomeData({
            primaryProps: {
              addon: addonForPromotedCategory(category),
            },
          });

          expect(
            screen.queryByRole('link', {
              name:
                `Firefox only recommends extensions that meet our ` +
                `standards for security and performance.`,
            }),
          ).not.toBeInTheDocument();
        },
      );
    });

    describe('for an external item', () => {
      it('renders a heading', () => {
        const name = 'External Name';
        renderWithHomeData({
          primaryProps: {
            external: {
              ...fakePrimaryHeroShelfExternalAddon,
              name: createLocalizedString(name),
            },
          },
        });

        expect(screen.getByRole('heading', { name })).toBeInTheDocument();
      });

      it('renders a link', () => {
        const url = 'http://hamsterdance.com/';
        const homepage = {
          'url': createLocalizedString(url),
          'outgoing': createLocalizedString(
            'https://outgoing.mozilla.org/hamster',
          ),
        };
        renderWithHomeData({
          primaryProps: {
            external: {
              ...fakePrimaryHeroShelfExternalAddon,
              homepage,
            },
          },
        });

        expect(
          screen.getByRole('link', { name: 'Get the extension' }),
        ).toHaveAttribute(
          'href',
          addQueryParams(url, {
            utm_source: DEFAULT_UTM_SOURCE,
            utm_medium: DEFAULT_UTM_MEDIUM,
            utm_content: PRIMARY_HERO_SRC,
          }),
        );
      });

      it('configures an external link to open in a new tab', () => {
        checkInternalURL.mockReturnValue({ isInternal: false });
        const url = 'http://hamsterdance.com/';
        const homepage = {
          'url': createLocalizedString(url),
          'outgoing': createLocalizedString(
            'https://outgoing.mozilla.org/hamster',
          ),
        };
        renderWithHomeData({
          primaryProps: {
            external: {
              ...fakePrimaryHeroShelfExternalAddon,
              homepage,
            },
          },
        });

        const link = screen.getByRole('link', { name: 'Get the extension' });
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('target', '_blank');
        expect(checkInternalURL).toHaveBeenCalledWith({
          urlString: addQueryParams(url, {
            utm_source: DEFAULT_UTM_SOURCE,
            utm_medium: DEFAULT_UTM_MEDIUM,
            utm_content: PRIMARY_HERO_SRC,
          }),
        });
      });

      it('does not configure an internal link to open in a new tab', () => {
        const url = '/some/path/';
        const homepage = {
          'url': createLocalizedString(url),
          'outgoing': createLocalizedString(
            'https://outgoing.mozilla.org/hamster',
          ),
        };
        checkInternalURL.mockReturnValue({
          isInternal: true,
          relativeURL: url,
        });
        renderWithHomeData({
          primaryProps: {
            external: {
              ...fakePrimaryHeroShelfExternalAddon,
              homepage,
            },
          },
        });

        const link = screen.getByRole('link', { name: 'Get the extension' });
        expect(link).not.toHaveAttribute('rel');
        expect(link).not.toHaveAttribute('target');
        expect(checkInternalURL).toHaveBeenCalledWith({
          urlString: addQueryParams(url, {
            utm_source: DEFAULT_UTM_SOURCE,
            utm_medium: DEFAULT_UTM_MEDIUM,
            utm_content: PRIMARY_HERO_SRC,
          }),
        });
      });
    });

    it('renders with an image', () => {
      const featuredImage = 'https://mozilla.org/featured.png';
      renderWithHomeData({
        primaryProps: {
          addon: fakeAddon,
          featuredImage,
        },
      });

      expect(screen.getByClassName('HeroRecommendation')).not.toHaveClass(
        'HeroRecommendation--no-image',
      );
      expect(screen.getByClassName('HeroRecommendation-image')).toHaveAttribute(
        'src',
        featuredImage,
      );
    });

    it('renders without an image', () => {
      renderWithHomeData({
        primaryProps: {
          addon: fakeAddon,
          featuredImage: null,
        },
      });

      expect(screen.getByClassName('HeroRecommendation')).toHaveClass(
        'HeroRecommendation--no-image',
      );
      expect(
        screen.queryByClassName('HeroRecommendation-image'),
      ).not.toBeInTheDocument();
    });

    it('assigns a className based on the gradient', () => {
      const gradient = { start: 'start-color', end: 'stop-color' };
      renderWithHomeData({
        primaryProps: {
          addon: fakeAddon,
          gradient,
        },
      });

      expect(screen.getByClassName('HeroRecommendation')).toHaveClass(
        `HeroRecommendation-${gradient.start}-${gradient.end}`,
      );
    });

    it('renders a body', () => {
      const description = 'some body text';
      renderWithHomeData({
        primaryProps: {
          addon: fakeAddon,
          description,
        },
      });

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    // See https://github.com/mozilla/addons-frontend/issues/9557
    it('can render an empty description', () => {
      renderWithHomeData({
        primaryProps: {
          addon: fakeAddon,
          description: '',
        },
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('allows some html tags in the body', () => {
      const descriptionText = 'Some body text';
      const description = `<blockquote><b>${descriptionText}</b></blockquote>`;
      renderWithHomeData({
        primaryProps: {
          addon: fakeAddon,
          description,
        },
      });

      expect(screen.getByText(descriptionText)).toBeInTheDocument();
      expect(
        within(screen.getByClassName('HeroRecommendation-body')).getByTagName(
          'b',
        ),
      ).toBeInTheDocument();
      expect(
        within(screen.getByClassName('HeroRecommendation-body')).getByTagName(
          'blockquote',
        ),
      ).toBeInTheDocument();
    });

    it('sanitizes html tags in the body', () => {
      const descriptionText = 'Some body text';
      const description = `<b>${descriptionText}</b>`;
      const scriptHtml = '<script>alert(document.cookie);</script>';
      renderWithHomeData({
        primaryProps: {
          addon: fakeAddon,
          description: `${description}${scriptHtml}`,
        },
      });

      expect(screen.getByText(descriptionText)).toBeInTheDocument();
      expect(
        within(screen.getByClassName('HeroRecommendation-body')).getByTagName(
          'b',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByTagName('script')).not.toBeInTheDocument();
    });

    it('renders an AppBanner', () => {
      const notice = 'site is kaput';
      store.dispatch(loadSiteStatus({ readOnly: false, notice }));
      render();

      expect(screen.getByText(notice)).toBeInTheDocument();
    });

    it('renders an error if present', () => {
      const message = 'Some error message';
      createFailedErrorHandler({
        id: errorHandlerId,
        message,
        store,
      });
      render();

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it.each([
      { readOnly: true, notice: null },
      { readOnly: false, notice: 'some notice' },
      { readOnly: true, notice: 'some notice' },
    ])(
      'assigns the expected class when an AppBanner is present, status: %s',
      (status) => {
        store.dispatch(loadSiteStatus(status));
        render();

        expect(screen.getByClassName('HeroRecommendation')).toHaveClass(
          'HeroRecommendation--height-with-notice',
        );
      },
    );

    it('assigns the expected class when an AppBanner is not present', () => {
      store.dispatch(loadSiteStatus({ readOnly: false, notice: null }));
      render();

      expect(screen.getByClassName('HeroRecommendation')).toHaveClass(
        'HeroRecommendation--height-without-notice',
      );
    });

    it('renders in a loading state', () => {
      render();

      expect(
        within(screen.getByClassName('HeroRecommendation')).getAllByRole(
          'alert',
        ),
      ).toHaveLength(5);
    });

    it('renders nothing if shelfData is null', () => {
      renderWithHomeData({
        homeShelves: {
          results: [fakeExternalShelf],
          primary: null,
          secondary: null,
        },
      });

      expect(
        screen.queryByClassName('HeroRecommendation'),
      ).not.toBeInTheDocument();
    });

    describe('tracking', () => {
      const withAddonShelfData = {
        primaryProps: {
          addon: fakeAddon,
        },
      };
      const withExternalShelfData = {
        primaryProps: {
          external: fakePrimaryHeroShelfExternalAddon,
        },
      };
      it.each([
        ['addon', withAddonShelfData],
        ['external', withExternalShelfData],
      ])(
        'sends a tracking event when the cta is clicked for %s',
        async (feature, shelfData) => {
          renderWithHomeData(shelfData);
          tracking.sendEvent.mockClear();

          await userEvent.click(
            screen.getByRole('link', { name: 'Get the extension' }),
          );

          expect(tracking.sendEvent).toHaveBeenCalledWith({
            action: PRIMARY_HERO_CLICK_ACTION,
            category: PRIMARY_HERO_CLICK_CATEGORY,
            label:
              feature === 'addon'
                ? shelfData.primaryProps.addon.guid
                : PRIMARY_HERO_EXTERNAL_LABEL,
          });
        },
      );

      it.each([
        ['addon', withAddonShelfData],
        ['external', withExternalShelfData],
      ])(
        'sends a tracking event for the impression on mount for %s',
        (feature, shelfData) => {
          renderWithHomeData(shelfData);

          expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
          expect(tracking.sendEvent).toHaveBeenCalledWith({
            action: PRIMARY_HERO_IMPRESSION_ACTION,
            category: PRIMARY_HERO_IMPRESSION_CATEGORY,
            label:
              feature === 'addon'
                ? shelfData.primaryProps.addon.guid
                : PRIMARY_HERO_EXTERNAL_LABEL,
          });
        },
      );

      it.each([
        ['addon', withAddonShelfData],
        ['external', withExternalShelfData],
      ])(
        'sends a tracking event for the impression on update for %s',
        async (feature, shelfData) => {
          render();

          expect(tracking.sendEvent).not.toHaveBeenCalled();

          _loadHomeData(shelfData);

          await waitFor(() => {
            expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
          });
          expect(tracking.sendEvent).toHaveBeenCalledWith({
            action: PRIMARY_HERO_IMPRESSION_ACTION,
            category: PRIMARY_HERO_IMPRESSION_CATEGORY,
            label:
              feature === 'addon'
                ? shelfData.primaryProps.addon.guid
                : PRIMARY_HERO_EXTERNAL_LABEL,
          });
        },
      );

      it('does not send a tracking event for the impression on mount or update if shelfData is missing', () => {
        render();

        expect(tracking.sendEvent).not.toHaveBeenCalled();

        _loadHomeData({
          homeShelves: {
            results: [fakeExternalShelf],
            primary: null,
            secondary: null,
          },
        });

        expect(tracking.sendEvent).not.toHaveBeenCalled();
      });
    });
  });

  it('renders a Page component passing `true` for `isHomePage`', () => {
    render();

    expect(screen.getByClassName('Page')).not.toHaveClass('Page-not-homepage');
    expect(
      screen.getByRole('heading', { name: 'Firefox Browser Add-ons' }),
    ).toBeInTheDocument();
  });

  it('renders a shelf with curated themes on desktop', () => {
    const expectedThemes = [
      'abstract',
      'nature',
      'film-and-tv',
      'scenery',
      'music',
      'seasonal',
    ];
    render();

    expect(
      screen.getByRole('heading', {
        name: 'Change the way Firefox looks with themes.',
      }),
    ).toBeInTheDocument();

    const themeLinks = screen.getAllByClassName('Home-SubjectShelf-link');
    expect(themeLinks).toHaveLength(expectedThemes.length);

    expectedThemes.forEach((slug, index) => {
      expect(themeLinks[index]).toHaveAttribute(
        'href',
        `/${defaultLang}/${defaultClientApp}${getCategoryResultsPathname({
          addonType: ADDON_TYPE_STATIC_THEME,
          slug,
        })}`,
      );
    });
  });

  it('does not render a shelf with curated themes on mobile', () => {
    const clientApp = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp, store });
    render({ location: getLocation({ clientApp }) });

    expect(
      screen.queryByRole('heading', {
        name: 'Change the way Firefox looks with themes.',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the recommended extensions shelf on android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp, store });
    render({ location: getLocation({ clientApp }) });

    expect(screen.getAllByClassName('LandingAddonsCard')).toHaveLength(2);
    expect(screen.getByText('Recommended extensions')).toBeInTheDocument();

    // Expect the shelf to be in a loading state.
    expect(
      within(screen.getByClassName('Home-RecommendedExtensions')).getAllByRole(
        'alert',
      ),
    ).toHaveLength(16);
  });

  it('renders the recommended extensions shelf with data loaded on android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp, store });
    const addonName = 'My Add-On';
    const addon = { ...fakeAddon, name: createLocalizedString(addonName) };
    const recommendedExtensions = createAddonsApiResult([addon]);
    renderWithHomeData({
      location: getLocation({ clientApp }),
      shelves: { recommendedExtensions },
    });

    expect(
      // eslint-disable-next-line testing-library/prefer-presence-queries
      within(screen.getByClassName('Home-RecommendedExtensions')).queryByRole(
        'alert',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
      'href',
      `/${defaultLang}/${clientApp}${addQueryParams(`/addon/${addon.slug}/`, {
        utm_source: DEFAULT_UTM_SOURCE,
        utm_medium: DEFAULT_UTM_MEDIUM,
        utm_content: INSTALL_SOURCE_FEATURED,
      })}`,
    );
  });

  it('renders the trending extensions shelf on android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp, store });
    render({ location: getLocation({ clientApp }) });

    expect(screen.getAllByClassName('LandingAddonsCard')).toHaveLength(2);
    expect(
      screen.getByText('Explore all Android extensions'),
    ).toBeInTheDocument();

    // Expect the shelf to be in a loading state.
    expect(
      within(screen.getByClassName('Home-TrendingExtensions')).getAllByRole(
        'alert',
      ),
    ).toHaveLength(32);
  });

  it('renders a comment for monitoring', () => {
    render();

    expect(screen.getByClassName('do-not-remove')).toBeInTheDocument();
  });

  it('renders the trending extensions shelf with data loaded on android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp, store });
    const addonName = 'My Add-On';
    const addon = { ...fakeAddon, name: createLocalizedString(addonName) };
    const trendingExtensions = createAddonsApiResult([addon]);

    renderWithHomeData({
      location: getLocation({ clientApp }),
      shelves: { trendingExtensions },
    });

    expect(
      // eslint-disable-next-line testing-library/prefer-presence-queries
      within(screen.getByClassName('Home-TrendingExtensions')).queryByRole(
        'alert',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
      'href',
      `/${defaultLang}/${clientApp}${addQueryParams(`/addon/${addon.slug}/`, {
        utm_source: DEFAULT_UTM_SOURCE,
        utm_medium: DEFAULT_UTM_MEDIUM,
        utm_content: INSTALL_SOURCE_FEATURED,
      })}`,
    );
  });

  it('dispatches an action to fetch the add-ons to display', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(setViewContext(VIEW_CONTEXT_HOME));
    expect(dispatch).toHaveBeenCalledWith(
      fetchHomeData({
        errorHandlerId,
        isDesktopSite: true,
      }),
    );
  });

  it('passes isDesktopSite: false to fetchHomeData on Android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp, store });
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ location: getLocation({ clientApp }) });

    expect(dispatch).toHaveBeenCalledWith(
      fetchHomeData({
        errorHandlerId,
        isDesktopSite: false,
      }),
    );
  });

  it('does not dispatch any actions when there is an error', () => {
    createFailedErrorHandler({
      id: errorHandlerId,
      store,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    // Expect only the LOCATION_CHANGE action which happens in the test helper.
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: LOCATION_CHANGE }),
    );
  });

  it('does not fetch data when isLoading is true', () => {
    store.dispatch(fetchHomeData({ errorHandlerId }));
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_HOME_DATA }),
    );
  });

  it('dispatches an action to fetch the add-ons to display on update', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithHomeData();

    dispatch.mockClear();

    expect(dispatch).toHaveBeenCalledTimes(0);

    await changeLocation({
      history,
      pathname: `/en-US/${CLIENT_APP_ANDROID}/`,
    });

    expect(dispatch).toHaveBeenCalledWith(setViewContext(VIEW_CONTEXT_HOME));
    expect(dispatch).toHaveBeenCalledWith(
      fetchHomeData({
        errorHandlerId,
        isDesktopSite: false,
      }),
    );
  });

  it('displays an error in the expected place on Android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const message = 'Some error message';
    dispatchClientMetadata({ clientApp, store });
    createFailedErrorHandler({
      id: errorHandlerId,
      message,
      store,
    });
    render({ location: getLocation({ clientApp }) });

    expect(screen.getByClassName('Home-noHeroError')).toHaveTextContent(
      message,
    );
  });

  it('displays an error in the expected place on desktop', () => {
    const message = 'Some error message';
    createFailedErrorHandler({
      id: errorHandlerId,
      message,
      store,
    });
    render();

    expect(screen.queryByClassName('Home-noHeroError')).not.toBeInTheDocument();
    expect(screen.getByClassName('HeroRecommendation')).toHaveTextContent(
      message,
    );
  });

  it('renders a HeadMetaTags component', async () => {
    render();

    // Without the waitFor, the meta tags have not rendered into the head yet.
    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        `Download Firefox extensions and themes. They’re like apps for your ` +
          `browser. They can block annoying ads, protect passwords, change ` +
          `browser appearance, and more.`,
      ),
    );
  });

  it('renders a static hero header for Android', () => {
    dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });

    render();

    expect(
      screen.getByRole('heading', { name: 'Firefox for Android extensions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /^Personalize Firefox for Android.+/,
      }),
    ).toBeInTheDocument();
  });

  it('does not render the heroHeader for Desktop', () => {
    renderWithHomeData({
      secondaryProps: { description: 'A description', headline: 'A Headline' },
    });

    expect(screen.queryByClassName('Home-heroHeader')).not.toBeInTheDocument();
  });

  it('renders a HeadLinks component', async () => {
    render();

    await waitFor(() =>
      expect(getElement('link[rel="canonical"]')).toBeInTheDocument(),
    );
  });

  it('does not render hero shelves on Android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp, store });
    renderWithHomeData({ location: getLocation({ clientApp }) });

    expect(
      screen.queryByClassName('HeroRecommendation'),
    ).not.toBeInTheDocument();
    expect(screen.queryByClassName('SecondaryHero')).not.toBeInTheDocument();
  });
});
