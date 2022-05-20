import userEvent from '@testing-library/user-event';

import {
  SECONDARY_HERO_CLICK_ACTION,
  SECONDARY_HERO_CLICK_CATEGORY,
  SECONDARY_HERO_SRC,
  makeCallToActionURL,
} from 'amo/components/SecondaryHero';
import {
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_MEDIUM,
  DEFAULT_UTM_SOURCE,
} from 'amo/constants';
import { loadHomeData } from 'amo/reducers/home';
import tracking from 'amo/tracking';
import { checkInternalURL, stripLangFromAmoUrl } from 'amo/utils';
import { addQueryParams } from 'amo/utils/url';
import {
  createHistory,
  createHomeShelves,
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
});
