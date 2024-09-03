import config from 'config';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';

import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_SOURCE,
  DEFAULT_UTM_MEDIUM,
  INSTALL_SOURCE_SUGGESTIONS,
  SUGGESTIONS_CLICK_CATEGORY,
} from 'amo/constants';
import {
  EXPERIMENT_CONFIG,
  VARIANT_HIDE,
  VARIANT_SHOW_MIDDLE,
  VARIANT_SHOW_TOP,
} from 'amo/experiments/20221130_amo_detail_category';
import { loadAddon } from 'amo/reducers/addons';
import {
  FETCH_SUGGESTIONS,
  fetchSuggestions,
  loadSuggestions,
} from 'amo/reducers/suggestions';
import tracking, { getAddonTypeForTracking } from 'amo/tracking';
import {
  changeLocation,
  createFailedErrorHandler,
  createFakeCollectionAddon,
  createLocalizedString,
  createExperimentCookie,
  dispatchClientMetadata,
  fakeAddon,
  getMockConfig,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

// We need to control the config, which is used by withExperiment, but we are
// rendering the Addon page, so we have to control it via mocking as
// opposed to injecting a _config prop.
jest.mock('config');

// We need this to avoid firing setDimension during tests, which will throw.
jest.mock('amo/tracking', () => ({
  ...jest.requireActual('amo/tracking'),
  sendEvent: jest.fn(),
  setDimension: jest.fn(),
  setUserProperties: jest.fn(),
}));

describe(__filename, () => {
  let addon;
  let fakeConfig;
  let history;
  let store;
  const addonCategory = 'feeds-news-blogging';
  // This is defined in AddonSuggestions for the above category.
  const collectionForCategory = '9be99620f151420b91ac1fb30573d0';
  const defaultClientApp = CLIENT_APP_FIREFOX;
  const defaultSlug = 'some-addon-slug';
  const errorHandlerId = 'AddonSuggestions';
  const lang = 'en-US';
  const suggestedAddonName = 'Suggested add-on name';
  const suggestedAddonSlug = 'suggested-add-on-slug';

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const makeExperimentsConfigKey = (enabled) => {
    return { [EXPERIMENT_CONFIG.id]: enabled };
  };

  beforeEach(() => {
    addon = {
      ...fakeAddon,
      categories: [addonCategory],
      slug: defaultSlug,
    };
    fakeConfig = getMockConfig({
      // By default, enable the experiment.
      experiments: makeExperimentsConfigKey(true),
    });
    store = dispatchClientMetadata({ lang }).store;
  });

  const _loadAddon = (addonToLoad = addon) => {
    store.dispatch(loadAddon({ addon: addonToLoad, slug: addonToLoad.slug }));
  };

  const render = ({
    clientApp = defaultClientApp,
    variant = VARIANT_SHOW_TOP,
  } = {}) => {
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });
    dispatchClientMetadata({ store, clientApp });
    createExperimentCookie({ experimentId: EXPERIMENT_CONFIG.id, variant });

    const renderOptions = {
      initialEntries: [`/${lang}/${clientApp}/addon/${addon.slug}`],
      store,
    };

    const renderResults = defaultRender(renderOptions);
    history = renderResults.history;
    return renderResults;
  };

  const renderWithAddon = ({
    addonToLoad = addon,
    clientApp = defaultClientApp,
    variant = VARIANT_SHOW_TOP,
  } = {}) => {
    _loadAddon(addonToLoad);
    return render({ clientApp, variant });
  };

  const doLoadSuggestions = ({
    addons = [
      createFakeCollectionAddon({
        addon: {
          ...fakeAddon,
          name: createLocalizedString(suggestedAddonName),
          slug: suggestedAddonSlug,
        },
      }),
    ],
    collection = collectionForCategory,
  } = {}) => {
    store.dispatch(
      loadSuggestions({
        addons,
        collection,
      }),
    );
  };

  it('renders AddonSuggestions if the variant is VARIANT_SHOW_TOP and the experiment is enabled', () => {
    doLoadSuggestions();

    renderWithAddon({ variant: VARIANT_SHOW_TOP });

    expect(
      screen.getAllByRole('link', { name: 'See Firefox Staff Picks' }),
    ).toHaveLength(1);
  });

  it('renders AddonSuggestions if the variant is VARIANT_SHOW_MIDDLE and the experiment is enabled', () => {
    doLoadSuggestions();

    renderWithAddon({ variant: VARIANT_SHOW_MIDDLE });

    expect(
      screen.getAllByRole('link', { name: 'See Firefox Staff Picks' }),
    ).toHaveLength(1);
  });

  it('does not render AddonSuggestions if the experiment is disabled', () => {
    fakeConfig = {
      ...fakeConfig,
      experiments: makeExperimentsConfigKey(false),
    };
    doLoadSuggestions();

    renderWithAddon({ variant: VARIANT_SHOW_TOP });

    expect(
      screen.queryByRole('link', { name: 'See Firefox Staff Picks' }),
    ).not.toBeInTheDocument();
  });

  it('does not render AddonSuggestions on Android', () => {
    doLoadSuggestions();

    renderWithAddon({
      clientApp: CLIENT_APP_ANDROID,
      variant: VARIANT_SHOW_TOP,
    });

    expect(
      screen.queryByRole('link', { name: 'See Firefox Staff Picks' }),
    ).not.toBeInTheDocument();
  });

  it('does not render AddonSuggestions if the variant is VARIANT_HIDE and the experiment is enabled', () => {
    doLoadSuggestions();

    renderWithAddon({ variant: VARIANT_HIDE });

    expect(
      screen.queryByRole('link', { name: 'See Firefox Staff Picks' }),
    ).not.toBeInTheDocument();
  });

  it.each([ADDON_TYPE_DICT, ADDON_TYPE_LANG, ADDON_TYPE_STATIC_THEME])(
    'does not render AddonSuggestions if the add-on is not an extension',
    (type) => {
      doLoadSuggestions();

      renderWithAddon({
        addonToLoad: { ...addon, type },
        variant: VARIANT_SHOW_TOP,
      });

      expect(
        screen.queryByRole('link', { name: 'See Firefox Staff Picks' }),
      ).not.toBeInTheDocument();
    },
  );

  describe('Tests for AddonSuggestions', () => {
    it('does not render AddonSuggestions if an error occurs', () => {
      createFailedErrorHandler({
        id: errorHandlerId,
        store,
      });
      renderWithAddon();

      expect(
        screen.queryByRole('link', { name: 'See Firefox Staff Picks' }),
      ).not.toBeInTheDocument();
    });

    it('renders AddonSuggestions in a loading state', () => {
      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      // Expect a loading indicator for the header, plus 4 x 4 for the loading
      // add-ons.
      expect(
        within(screen.getByClassName('AddonSuggestions')).getAllByRole('alert'),
      ).toHaveLength(17);
    });

    it('dispatches fetchSuggestions if they do not already exist', () => {
      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      expect(dispatch).toHaveBeenCalledWith(
        fetchSuggestions({
          collection: collectionForCategory,
          errorHandlerId,
        }),
      );
    });

    it('does not dispatch fetchSuggestions if they are already loading', () => {
      store.dispatch(
        fetchSuggestions({ collection: collectionForCategory, errorHandlerId }),
      );
      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_SUGGESTIONS }),
      );
    });

    it('does not dispatch fetchSuggestions if they are already loaded', () => {
      doLoadSuggestions();
      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_SUGGESTIONS }),
      );
    });

    it('does not dispatch fetchSuggestions without an addon', () => {
      const dispatch = jest.spyOn(store, 'dispatch');

      render({ variant: VARIANT_SHOW_TOP });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_SUGGESTIONS }),
      );
    });

    it('does not dispatch fetchSuggestions if the addon does not have a category', () => {
      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithAddon({
        addonToLoad: { ...addon, categories: [] },
        variant: VARIANT_SHOW_TOP,
      });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_SUGGESTIONS }),
      );
    });

    // In this case we don't preload the new add-on, which means that when
    // the page changes to point at the new add-on, AddonSuggestions never
    // sees the old add-on and the new add-on at the same time, so guid is
    // irrelevant.
    it('dispatches fetchSuggestions for a new add-on', async () => {
      const newCategory = 'privacy-security';
      const newCollection = 'privacy-matters';
      const newSlug = 'some-new-slug';
      const newAddon = {
        ...addon,
        categories: [newCategory],
        slug: newSlug,
      };

      doLoadSuggestions();

      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      dispatch.mockClear();

      // Update the slug used for the Addon component.
      await changeLocation({
        history,
        pathname: `/${lang}/${defaultClientApp}/addon/${newSlug}/`,
      });

      // Load the new add-on so it can be used to fetch new suggestions.
      await act(async () =>
        store.dispatch(loadAddon({ addon: newAddon, slug: newSlug })),
      );

      expect(dispatch).toHaveBeenCalledWith(
        fetchSuggestions({
          collection: newCollection,
          errorHandlerId,
        }),
      );
    });

    // In the next two cases we do preload the new add-on, which means that
    // AddonSuggestions will consider the difference between guids.
    it('dispatches fetchSuggestions for a new add-on with a different guid', async () => {
      const newCategory = 'privacy-security';
      const newCollection = 'privacy-matters';
      const newSlug = 'some-new-slug';
      const newAddon = {
        ...addon,
        categories: [newCategory],
        guid: `${addon.guid}-new`,
        slug: newSlug,
      };

      // Preload the new add-on so the Addon page doesn't actually need to fetch it.
      store.dispatch(loadAddon({ addon: newAddon, slug: newSlug }));

      doLoadSuggestions();

      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      dispatch.mockClear();

      // Update the slug used for the Addon component.
      await changeLocation({
        history,
        pathname: `/${lang}/${defaultClientApp}/addon/${newSlug}/`,
      });

      // Load the new add-on so it can be used to fetch new suggestions.
      await act(async () =>
        store.dispatch(loadAddon({ addon: newAddon, slug: newSlug })),
      );

      expect(dispatch).toHaveBeenCalledWith(
        fetchSuggestions({
          collection: newCollection,
          errorHandlerId,
        }),
      );
    });

    it('does not dispatch fetchSuggestions if the guid does not change', async () => {
      const newSlug = 'some-new-slug';
      const newAddon = { ...addon, slug: newSlug };

      // Preload the new add-on so the Addon page doesn't actually need to fetch it.
      store.dispatch(loadAddon({ addon: newAddon, slug: newSlug }));

      doLoadSuggestions();

      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      dispatch.mockClear();

      // Update the slug used for the Addon component.
      await changeLocation({
        history,
        pathname: `/${lang}/${defaultClientApp}/addon/${newSlug}/`,
      });

      // Load the new add-on so it can be used to fetch new suggestions.
      await act(async () =>
        store.dispatch(loadAddon({ addon: newAddon, slug: newSlug })),
      );

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_SUGGESTIONS }),
      );
    });

    it('sends a tracking event when a suggestion is clicked', async () => {
      doLoadSuggestions();
      renderWithAddon({ variant: VARIANT_SHOW_TOP });
      tracking.sendEvent.mockClear();

      await userEvent.click(
        screen.getByRole('link', { name: suggestedAddonName }),
      );

      expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
      expect(tracking.sendEvent).toHaveBeenCalledWith({
        action: getAddonTypeForTracking(addon.type),
        category: SUGGESTIONS_CLICK_CATEGORY,
        label: addon.guid,
      });
    });

    it('displays the expected shelf heading and footer for a category', () => {
      doLoadSuggestions();
      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      expect(
        screen.getByText('More great extensions for feeds, news & media'),
      ).toBeInTheDocument();

      expect(screen.getByText('See Firefox Staff Picks')).toHaveAttribute(
        'href',
        `/${lang}/${defaultClientApp}/collections/${config.get(
          'mozillaUserId',
        )}/${collectionForCategory}/?addonInstallSource=${INSTALL_SOURCE_SUGGESTIONS}`,
      );
    });

    it.each([
      // Lower priority first.
      [['download-management', 'privacy-security']],
      // Higher priority first.
      [['privacy-security', 'download-management']],
      // Only one category.
      [['privacy-security']],
    ])(
      'chooses the correct category based on the hierarchy',
      (addonCategories) => {
        doLoadSuggestions({ collection: 'privacy-matters' });
        renderWithAddon({
          addonToLoad: {
            ...addon,
            categories: addonCategories,
          },
          variant: VARIANT_SHOW_TOP,
        });

        expect(
          screen.getByText('More powerful privacy & security extensions'),
        ).toBeInTheDocument();
      },
    );

    it('only displays 4 add-ons in the shelf', () => {
      doLoadSuggestions({
        addons: Array(10).fill(
          createFakeCollectionAddon({
            addon: {
              ...fakeAddon,
              name: createLocalizedString(suggestedAddonName),
            },
          }),
        ),
      });
      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      expect(
        screen.getAllByRole('link', { name: suggestedAddonName }),
      ).toHaveLength(4);
    });

    it('passes the expected addonInstallSource to the LandingAddonsCard', () => {
      doLoadSuggestions();
      renderWithAddon({ variant: VARIANT_SHOW_TOP });

      const expectedQuerystring = [
        `utm_source=${DEFAULT_UTM_SOURCE}`,
        `utm_medium=${DEFAULT_UTM_MEDIUM}`,
        `utm_content=${INSTALL_SOURCE_SUGGESTIONS}`,
      ].join('&');

      expect(
        screen.getByRole('link', { name: suggestedAddonName }),
      ).toHaveAttribute(
        'href',
        `/${lang}/${defaultClientApp}/addon/${suggestedAddonSlug}/?${expectedQuerystring}`,
      );
    });
  });
});
