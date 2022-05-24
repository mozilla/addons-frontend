import { waitFor } from '@testing-library/react';

import { setViewContext } from 'amo/actions/viewContext';
import { GET_LANDING, getLanding, loadLanding } from 'amo/reducers/landing';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
} from 'amo/constants';
import { getCanonicalURL, visibleAddonType } from 'amo/utils';
import {
  createAddonsApiResult,
  createFailedErrorHandler,
  createHistory,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  getElement,
  onLocationChanged,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  const errorHandlerId = 'LandingPage';
  const getLocation = (addonType = ADDON_TYPE_EXTENSION) =>
    `/${lang}/${clientApp}/${visibleAddonType(addonType)}/`;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const render = ({ addonType = ADDON_TYPE_EXTENSION } = {}) => {
    return defaultRender({
      history: createHistory({
        initialEntries: [getLocation(addonType)],
      }),
      store,
    });
  };

  const _getAndLoadLandingAddons = ({
    addonType = ADDON_TYPE_EXTENSION,
    numberOfAddons = 1,
    ...otherParams
  } = {}) => {
    store.dispatch(
      getLanding({
        addonType,
        errorHandlerId,
      }),
    );
    store.dispatch(
      loadLanding({
        addonType,
        recommended: createAddonsApiResult(
          Array(numberOfAddons).fill({
            ...fakeAddon,
            name: createLocalizedString('Featured'),
            slug: 'recommended',
            type: addonType,
          }),
        ),
        highlyRated: createAddonsApiResult(
          Array(numberOfAddons).fill({
            ...fakeAddon,
            name: createLocalizedString('High'),
            slug: 'high',
            type: addonType,
          }),
        ),
        trending: createAddonsApiResult(
          Array(numberOfAddons).fill({
            ...fakeAddon,
            name: createLocalizedString('Trending'),
            slug: 'trending',
            type: addonType,
          }),
        ),
        ...otherParams,
      }),
    );
  };

  it('dispatches setViewContext on load and update', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(setViewContext(ADDON_TYPE_EXTENSION));

    dispatch.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(ADDON_TYPE_STATIC_THEME),
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      setViewContext(ADDON_TYPE_STATIC_THEME),
    );
  });

  it('dispatches getLanding when results are not loaded', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      getLanding({
        addonType: ADDON_TYPE_EXTENSION,
        errorHandlerId,
      }),
    );
  });

  it('dispatches getLanding when addon type changes', () => {
    // We load theme add-ons.
    _getAndLoadLandingAddons({ addonType: ADDON_TYPE_STATIC_THEME });
    store.dispatch(setViewContext(ADDON_TYPE_STATIC_THEME));
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ addonType: ADDON_TYPE_STATIC_THEME });

    dispatch.mockClear();

    // Now we request extension add-ons.
    store.dispatch(
      onLocationChanged({
        pathname: getLocation(ADDON_TYPE_EXTENSION),
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      getLanding({
        addonType: ADDON_TYPE_EXTENSION,
        errorHandlerId,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(setViewContext(ADDON_TYPE_EXTENSION));
  });

  it('does not dispatch getLanding when addon type does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;

    // We load extension add-ons.
    _getAndLoadLandingAddons({ addonType });

    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    dispatch.mockClear();

    // We request extension add-ons again.
    store.dispatch(
      onLocationChanged({
        pathname: getLocation(addonType),
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: GET_LANDING }),
    );
  });

  it('does not dispatch getLanding while loading', () => {
    store.dispatch(
      getLanding({
        addonType: ADDON_TYPE_EXTENSION,
        errorHandlerId,
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: GET_LANDING }),
    );
  });

  it('does not dispatch getLanding when there is an error', () => {
    createFailedErrorHandler({
      id: errorHandlerId,
      store,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: GET_LANDING }),
    );
  });

  it('renders an error', () => {
    const message = 'Some error message';
    createFailedErrorHandler({
      id: errorHandlerId,
      message,
      store,
    });
    render();

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders a LandingPage with no addons set', () => {
    render();

    expect(
      screen.getByText(
        `Explore powerful tools and features to customize Firefox and make ` +
          `the browser all your own.`,
      ),
    ).toBeInTheDocument();
  });

  it('renders a link to all categories', () => {
    render();

    expect(
      screen.getByRole('link', { name: 'Explore all categories' }),
    ).toBeInTheDocument();
  });

  it('does not render a theme class name when page type is extensions', () => {
    render({ addonType: ADDON_TYPE_EXTENSION });

    expect(screen.getByClassName('LandingPage')).not.toHaveClass(
      'LandingPage--theme',
    );
  });

  it('renders a theme class name when page type is themes', () => {
    render({ addonType: ADDON_TYPE_STATIC_THEME });

    expect(screen.getByClassName('LandingPage')).toHaveClass(
      'LandingPage--theme',
    );
  });

  it.each([ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME])(
    'sets the links in each footer for %s',
    (addonType) => {
      const numberOfAddons =
        addonType === ADDON_TYPE_EXTENSION
          ? LANDING_PAGE_EXTENSION_COUNT
          : LANDING_PAGE_THEME_COUNT;
      const typeName =
        addonType === ADDON_TYPE_EXTENSION ? 'extensions' : 'themes';
      _getAndLoadLandingAddons({ addonType, numberOfAddons });
      render({ addonType });

      expect(
        screen.getByRole('link', { name: `See more recommended ${typeName}` }),
      ).toHaveAttribute(
        'href',
        [
          `/${lang}/${clientApp}/search/?promoted=${RECOMMENDED}`,
          `sort=${SEARCH_SORT_RANDOM}`,
          `type=${addonType}`,
        ].join('&'),
      );

      const expectedHref = (sort) =>
        addonType === ADDON_TYPE_EXTENSION
          ? [
              `/${lang}/${clientApp}/search/?promoted=${RECOMMENDED}`,
              `sort=${sort}`,
              `type=${addonType}`,
            ].join('&')
          : [
              `/${lang}/${clientApp}/search/?sort=${sort}`,
              `type=${addonType}`,
            ].join('&');

      expect(
        screen.getByRole('link', { name: `See more top rated ${typeName}` }),
      ).toHaveAttribute('href', expectedHref(SEARCH_SORT_TOP_RATED));

      expect(
        screen.getByRole('link', { name: `See more trending ${typeName}` }),
      ).toHaveAttribute('href', expectedHref(SEARCH_SORT_TRENDING));
    },
  );

  it('passes an isTheme prop as true if type is a theme', () => {
    _getAndLoadLandingAddons({ addonType: ADDON_TYPE_STATIC_THEME });
    render({ addonType: ADDON_TYPE_STATIC_THEME });

    expect(screen.getAllByClassName('LandingAddonsCard-Themes')).toHaveLength(
      3,
    );
  });

  it('passes an isTheme prop as false if type is an extension', () => {
    _getAndLoadLandingAddons({ addonType: ADDON_TYPE_EXTENSION });
    render({ addonType: ADDON_TYPE_EXTENSION });

    expect(
      screen.queryByClassName('LandingAddonsCard-Themes'),
    ).not.toBeInTheDocument();
  });

  it('renders a LandingPage with themes HTML', () => {
    render({ addonType: ADDON_TYPE_STATIC_THEME });

    expect(
      screen.getByText(
        `Change your browser's appearance. Choose from ` +
          `thousands of themes to give Firefox the look you want.`,
      ),
    ).toBeInTheDocument();
  });

  it('renders each add-on when set', () => {
    const addonType = ADDON_TYPE_STATIC_THEME;
    render({ addonType });
    store.dispatch(
      loadLanding({
        addonType,
        recommended: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('Howdy'), slug: 'howdy' },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again'),
            slug: 'howdy-again',
            type: addonType,
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy 2'),
            slug: 'howdy-2',
            type: addonType,
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again 2'),
            slug: 'howdy-again-2',
            type: addonType,
          },
        ]),
        highlyRated: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('High'),
            slug: 'high',
            type: addonType,
          },

          {
            ...fakeAddon,
            name: createLocalizedString('High again'),
            slug: 'high-again',
            type: addonType,
          },
        ]),
        trending: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('Pop'),
            slug: 'pop',
            type: addonType,
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Pop again'),
            slug: 'pop-again',
            type: addonType,
          },
        ]),
      }),
    );

    const expectNameLink = (name) =>
      expect(screen.getByRole('link', { name })).toBeInTheDocument();

    // recommended
    ['Howdy', 'Howdy again', 'Howdy 2', 'Howdy again 2'].forEach(
      expectNameLink,
    );
    // highly rated
    ['High', 'High again'].forEach(expectNameLink);
    // trending
    ['Pop', 'Pop again'].forEach(expectNameLink);
  });

  it('dispatches getLanding when category filter is set', () => {
    const addonType = ADDON_TYPE_EXTENSION;

    // This loads a set of add-ons for a category.
    store.dispatch(
      getLanding({
        addonType,
        category: 'some-category',
        errorHandlerId,
      }),
    );
    store.dispatch(
      loadLanding({
        addonType,
        recommended: createAddonsApiResult([]),
        highlyRated: createAddonsApiResult([]),
        trending: createAddonsApiResult([]),
      }),
    );

    const dispatch = jest.spyOn(store, 'dispatch');
    render({ addonType });

    expect(dispatch).toHaveBeenCalledWith(setViewContext(ADDON_TYPE_EXTENSION));
    expect(dispatch).toHaveBeenCalledWith(
      getLanding({ addonType, errorHandlerId }),
    );
  });

  it('does not dispatch setViewContext when addonType does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    store.dispatch(getLanding({ addonType, errorHandlerId }));
    store.dispatch(setViewContext(addonType));
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ addonType });

    dispatch.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(addonType),
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(setViewContext(addonType));
  });

  it('renders an HTML title for themes', async () => {
    render({ addonType: ADDON_TYPE_STATIC_THEME });

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent('Themes'),
    );
  });

  it('renders an HTML title for extensions', async () => {
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent('Extensions'),
    );
  });

  it('hides the trending shelf when there are no add-ons for it', () => {
    _getAndLoadLandingAddons({ trending: createAddonsApiResult([]) });
    render();

    expect(screen.getByText('Recommended extensions')).toBeInTheDocument();
    expect(screen.getByText('Top rated extensions')).toBeInTheDocument();
    expect(screen.queryByText('Trending extensions')).not.toBeInTheDocument();
  });

  it('hides the recommended shelf when there are no add-ons for it', () => {
    _getAndLoadLandingAddons({ recommended: createAddonsApiResult([]) });
    render();

    expect(
      screen.queryByText('Recommended extensions'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Top rated extensions')).toBeInTheDocument();
    expect(screen.getByText('Trending extensions')).toBeInTheDocument();
  });

  it('hides the highly rated shelf when there are no add-ons for it', () => {
    _getAndLoadLandingAddons({ highlyRated: createAddonsApiResult([]) });
    render();

    expect(screen.getByText('Recommended extensions')).toBeInTheDocument();
    expect(screen.queryByText('Top rated extensions')).not.toBeInTheDocument();
    expect(screen.getByText('Trending extensions')).toBeInTheDocument();
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'Download Firefox Extensions to add features'],
    [ADDON_TYPE_STATIC_THEME, 'Download themes to change how Firefox looks.'],
  ])(
    'renders a HeadMetaTags component for %s',
    async (addonType, description) => {
      render({ addonType });

      await waitFor(() =>
        expect(getElement('meta[name="description"]')).toBeInTheDocument(),
      );

      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        expect.stringContaining(description),
      );
    },
  );

  it('renders a HeadLinks component', async () => {
    render();

    await waitFor(() =>
      expect(getElement('link[rel="canonical"]')).toBeInTheDocument(),
    );

    expect(getElement('link[rel="canonical"]')).toHaveAttribute(
      'href',
      getCanonicalURL({ locationPathname: getLocation() }),
    );
  });
});
