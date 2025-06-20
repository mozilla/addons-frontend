import { LOCATION_CHANGE } from 'redux-first-history';
import config from 'config';
import serialize from 'serialize-javascript';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createAddonReview, setLatestReview } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import { getAddon } from 'amo/addonManager';
import { TAAR_IMPRESSION_CATEGORY } from 'amo/components/AddonRecommendations';
import {
  CONTRIBUTE_BUTTON_CLICK_ACTION,
  CONTRIBUTE_BUTTON_CLICK_CATEGORY,
} from 'amo/components/ContributeCard';
import {
  ADDONS_CONTENT_REVIEW,
  ADDONS_EDIT,
  ADDONS_REVIEW,
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_SOURCE,
  FATAL_ERROR,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  INSTALLING,
  RECOMMENDED,
  LINE,
  SPOTLIGHT,
  STRATEGIC,
  REVIEWER_TOOLS_VIEW,
  SET_VIEW_CONTEXT,
  STATIC_THEMES_REVIEW,
} from 'amo/constants';
import {
  EXPERIMENT_CONFIG,
  VARIANT_SHOW,
} from 'amo/experiments/20210714_amo_vpn_promo';
import { EXPERIMENT_CONFIG as suggestionsExperimentConfig } from 'amo/experiments/20221130_amo_detail_category';
import { ADDONS_BY_AUTHORS_COUNT, extractId } from 'amo/pages/Addon';
import {
  FETCH_ADDON,
  LOAD_ADDON,
  fetchAddon,
  getAddonByIdInURL,
  loadAddon,
} from 'amo/reducers/addons';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  FETCH_ADDONS_BY_AUTHORS,
  fetchAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { setClientApp } from 'amo/reducers/api';
import { FETCH_CATEGORIES } from 'amo/reducers/categories';
import { setInstallError, setInstallState } from 'amo/reducers/installations';
import {
  FETCH_RECOMMENDATIONS,
  OUTCOME_CURATED,
  OUTCOME_RECOMMENDED,
  OUTCOME_RECOMMENDED_FALLBACK,
  fetchRecommendations,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import {
  SEND_SERVER_REDIRECT,
  sendServerRedirect,
} from 'amo/reducers/redirectTo';
import { reviewListURL } from 'amo/reducers/reviews';
import { getVersionById } from 'amo/reducers/versions';
import tracking from 'amo/tracking';
import { getCanonicalURL } from 'amo/utils';
import { getPromotedBadgesLinkUrl } from 'amo/utils/promoted';
import { getAddonJsonLinkedData } from 'amo/utils/addons';
import {
  correctedLocationForPlatform,
  getClientCompatibility,
} from 'amo/utils/compatibility';
import {
  changeLocation,
  createCapturedErrorHandler,
  createFailedErrorHandler,
  createFakeClientCompatibility,
  createFakeErrorHandler,
  createLocalizedString,
  createExperimentCookie,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAddon,
  fakeAuthor,
  fakeAuthors,
  fakeFile,
  fakePreview,
  fakeRecommendations,
  fakeVersion,
  getElement,
  getMockConfig,
  loadAddonsByAuthors,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

// In order to force the WrongPlatformWarning to appear, mock correctedLocationForPlatform,
// and mock getClientCompatibility for InstallButtonWrapper.
jest.mock('amo/utils/compatibility', () => ({
  ...jest.requireActual('amo/utils/compatibility'),
  correctedLocationForPlatform: jest
    .fn()
    .mockReturnValue('/a/different/location/'),
  getClientCompatibility: jest.fn().mockReturnValue({
    compatible: true,
    reason: null,
  }),
}));

jest.mock('amo/addonManager', () => ({
  ...jest.requireActual('amo/addonManager'),
  getAddon: jest.fn().mockResolvedValue({
    isActive: true,
    isEnabled: true,
    type: 'extension',
  }),
  hasAddonManager: jest.fn().mockReturnValue(true),
}));

jest.mock('amo/tracking', () => ({
  ...jest.requireActual('amo/tracking'),
  sendEvent: jest.fn(),
  setDimension: jest.fn(),
  setUserProperties: jest.fn(),
}));

jest.mock('config');

describe(__filename, () => {
  const defaultAddonName = 'My Add-On';
  const authorName = fakeAuthors[0].name;
  const authorUserId = fakeAuthors[0].id;
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultAddonId = 555;
  const defaultSlug = 'reviewed-add-on';
  const lang = 'en-US';
  let store;
  let addon;
  let history;

  const getLocation = ({ page, slug = defaultSlug } = {}) => {
    return `/${lang}/${clientApp}/addon/${slug}/${
      page ? `?page=${page}/` : ''
    }`;
  };

  const getErrorHandlerId = (slug = defaultSlug) =>
    `src/amo/pages/Addon/index.js-${slug}`;

  const fakeErrorHandler = createFakeErrorHandler({ id: getErrorHandlerId() });

  const mockClientHeight = (height) =>
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: height,
    });

  beforeEach(() => {
    addon = {
      ...fakeAddon, // By default loads an add-on with an expected author.
      authors: [fakeAuthors[0]],
      id: defaultAddonId,
      name: createLocalizedString(defaultAddonName),
      slug: defaultSlug,
    };

    // Disable the AddonSuggestions experiment for the tests in this file.
    const fakeConfig = getMockConfig({
      experiments: { [suggestionsExperimentConfig.id]: false },
    });

    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });

    store = dispatchClientMetadata({ clientApp, lang, regionCode: 'US' }).store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
    mockClientHeight(100);
  });

  const render = ({ location, slug = defaultSlug } = {}) => {
    const renderOptions = {
      initialEntries: [location || getLocation(slug)],
      store,
    };

    const renderResults = defaultRender(renderOptions);
    history = renderResults.history;
    return renderResults;
  };

  const _loadAddon = () => {
    store.dispatch(loadAddon({ addon, slug: addon.slug }));
  };

  const renderWithAddon = ({ location, slug = defaultSlug } = {}) => {
    _loadAddon();
    return render({ location, slug });
  };

  const renderWithPermissions = ({
    shouldLoadAddon = true,
    permissions,
    ...props
  }) => {
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    dispatchSignInActionsWithStore({
      store,
      userProps: { permissions: perms },
    });
    if (shouldLoadAddon) {
      _loadAddon();
    }
    return render(props);
  };

  const createVersionWithPermissions = ({
    host = [],
    optional = [],
    required = [],
    optional_data_collection = [],
    required_data_collection = [],
    versionProps = {},
  } = {}) => {
    return {
      ...fakeVersion,
      file: {
        ...fakeFile,
        host_permissions: host,
        optional_permissions: optional,
        permissions: required,
        data_collection_permissions: required_data_collection,
        optional_data_collection_permissions: optional_data_collection,
      },

      ...versionProps,
    };
  };

  it('sets the ViewContext with the current add-on type', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();

    expect(dispatch).toHaveBeenCalledWith(setViewContext(addon.type));
  });

  it('updates the ViewContext on update', async () => {
    renderWithAddon();
    expect(screen.getByRole('link', { name: 'Extensions' })).toHaveClass(
      'SectionLinks-link--active',
    );

    addon.type = ADDON_TYPE_STATIC_THEME;
    _loadAddon();

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Themes' })).toHaveClass(
        'SectionLinks-link--active',
      ),
    );
  });

  it('only dispatches setViewContext for a new addon type', () => {
    renderWithAddon();

    const dispatch = jest.spyOn(store, 'dispatch');
    _loadAddon();

    expect(dispatch).not.toHaveBeenCalledWith(setViewContext(addon.type));
  });

  it('does not set the ViewContext if there is no addon', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': SET_VIEW_CONTEXT }),
    );
  });

  it('does not dispatch actions without an add-on if error handler has an error', () => {
    createFailedErrorHandler({
      id: getErrorHandlerId(),
      store,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_ADDON }),
    );
  });

  it('does not dispatch actions with an add-on if error handler has an error', () => {
    createFailedErrorHandler({
      id: getErrorHandlerId(),
      store,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': SET_VIEW_CONTEXT }),
    );
  });

  it('does not dispatch any new actions if error handler has an error on update', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();
    dispatch.mockClear();

    // Requesting a new add-on will dispatch FETCH_ADDON.
    await changeLocation({
      history,
      pathname: getLocation({ slug: `${defaultSlug}-new` }),
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_ADDON }),
    );

    dispatch.mockClear();

    // Create a failed error handler for the next slug to be requested.
    createFailedErrorHandler({
      id: getErrorHandlerId(`${defaultSlug}-new-again`),
      store,
    });

    await changeLocation({
      history,
      pathname: getLocation({ slug: `${defaultSlug}-new-again` }),
    });

    // Because of the error, no fetch should have been dispatched.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_ADDON }),
    );
  });

  it('renders an AddonTitle', () => {
    renderWithAddon();

    expect(
      screen.getByRole('heading', {
        name: `${defaultAddonName} by ${authorName}`,
      }),
    ).toBeInTheDocument();
  });

  it('renders a WrongPlatformWarning component', () => {
    renderWithAddon();

    expect(
      screen.getByClassName('Addon-WrongPlatformWarning'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'visit our desktop site',
      }),
    ).toHaveAttribute('href', '/a/different/location/');
    expect(
      screen.getByText(/To explore Firefox for desktop add-ons, please/),
    ).toBeInTheDocument();
  });

  it('does not render a WrongPlatformWarning component without an addon', () => {
    render();

    expect(
      screen.queryByClassName('Addon-WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });

  it('renders without an add-on', () => {
    render();

    expect(screen.getAllByRole('alert')).toHaveLength(19);
  });

  it('renders without a version', () => {
    addon.current_version = null;
    renderWithAddon();

    expect(screen.getAllByRole('alert')).toHaveLength(41);
  });

  it('fetches an add-on when rendering without an add-on', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchAddon({
        errorHandler: fakeErrorHandler,
        showGroupedRatings: true,
        slug: defaultSlug,
      }),
    );
  });

  it('does not fetch an add-on when already loading', () => {
    // Start fetching an add-on.
    store.dispatch(
      fetchAddon({
        errorHandler: fakeErrorHandler,
        showGroupedRatings: true,
        slug: defaultSlug,
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');

    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_ADDON }),
    );
  });

  it('does not fetch an add-on when slugs are the same', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();

    // Force an update via an unrelated prop.
    const { api } = store.getState();
    store.dispatch(setClientApp(api.clientApp));

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_ADDON }),
    );
  });

  it('fetches an add-on when updating to a new slug', async () => {
    const newSlug = 'some-new-slug';
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();

    // Update the slug used for the Addon component.
    await changeLocation({
      history,
      pathname: `/${lang}/${clientApp}/addon/${newSlug}/`,
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        'type': FETCH_ADDON,
        payload: expect.objectContaining({ slug: newSlug }),
      }),
    );
  });

  it('does not fetch an add-on on update when already loading', async () => {
    const newSlug = 'some-new-slug';
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();

    // Start fetching an add-on.
    store.dispatch(
      fetchAddon({
        errorHandler: fakeErrorHandler,
        slug: newSlug,
      }),
    );
    dispatch.mockClear();

    // Update the slug used for the Addon component.
    await changeLocation({
      history,
      pathname: `/${lang}/${clientApp}/addon/${newSlug}/`,
    });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_ADDON }),
    );
  });

  it('renders an error if there is one', () => {
    const message = 'Some unique error message';
    createFailedErrorHandler({
      id: getErrorHandlerId(),
      message,
      store,
    });
    renderWithAddon();

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByClassName('ErrorList')).toBeInTheDocument();
  });

  it('passes the errorHandler to the Page component', () => {
    createCapturedErrorHandler({
      id: getErrorHandlerId(),
      status: 451,
      store,
    });
    renderWithAddon();

    // We can verify the error handler was passed because Page will respond
    // to the 451 error.
    expect(
      screen.getByText('That page is not available in your region'),
    ).toBeInTheDocument();
  });

  it('passes props to the Page component', () => {
    renderWithAddon();

    // By passing isAddonInstallPage to Page, the GetFirefoxBanner is not shown.
    expect(screen.queryByText('download Firefox')).not.toBeInTheDocument();

    // The WrongPlatformWarning is shown, but it is the one embedded by Addon,
    // not the one from Page.
    expect(
      screen.getByClassName('Addon-WrongPlatformWarning'),
    ).toBeInTheDocument();
    expect(
      screen.queryByClassName('Page-WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });

  describe('VPNPromoBanner integration', () => {
    beforeEach(() => {
      const fakeConfig = getMockConfig({
        enableFeatureVPNPromo: true,
        experiments: {
          [EXPERIMENT_CONFIG.id]: true,
        },
      });
      config.get.mockImplementation((key) => {
        return fakeConfig[key];
      });

      // Write a cookie that will allow the Banner to appear.
      createExperimentCookie({
        experimentId: EXPERIMENT_CONFIG.id,
        variant: VARIANT_SHOW,
      });
    });

    it('passes showVPNPromo as `true` to Page if the add-on is an extension', () => {
      renderWithAddon();

      expect(
        screen.getByRole('link', { name: 'Get Mozilla VPN' }),
      ).toBeInTheDocument();
    });

    it.each([ADDON_TYPE_DICT, ADDON_TYPE_LANG, ADDON_TYPE_STATIC_THEME])(
      'passes showVPNPromo as `false` to Page if the add-on is a %s',
      (type) => {
        addon.type = type;
        renderWithAddon();

        expect(
          screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
        ).not.toBeInTheDocument();
      },
    );

    it('passes showVPNPromo as `false` to Page if the add-on is null', () => {
      render();

      expect(
        screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
      ).not.toBeInTheDocument();
    });
  });

  const testServerRedirect = ({ slugInURL }) => {
    const location = `/${lang}/${clientApp}/addon/${slugInURL}/`;
    store.dispatch(loadAddon({ addon, slug: slugInURL }));
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon({ location });

    expect(dispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: getLocation(addon.slug),
      }),
    );
    return dispatch;
  };

  it('dispatches a server redirect when slug is a numeric ID', () => {
    const dispatch = testServerRedirect({ slugInURL: addon.id });
    // 1. Initial LOAD_ADDON
    // 2. @@router/LOCATION_CHANGE, which happens before rendering in the
    // test helper.
    // 3. SEND_SERVER_REDIRECT
    // 4. FETCH_CATEGORIES (initiated by AddonMoreInfo)
    // 5. FETCH_ADDONS_BY_AUTHORS (initiated by AddonsByAuthorsCard)
    // 6. FETCH_RECOMMENDATIONS (initiated by AddonRecommendations)

    expect(dispatch).toHaveBeenCalledTimes(6);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: LOAD_ADDON }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: LOCATION_CHANGE }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: SEND_SERVER_REDIRECT }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_CATEGORIES }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDONS_BY_AUTHORS }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_RECOMMENDATIONS }),
    );
  });

  it('dispatches a server redirect when slug has trailing spaces', () => {
    expect(testServerRedirect({ slugInURL: `${defaultSlug}  ` })).toBeTruthy();
  });

  it('dispatches a server redirect when slug is a stringified integer greater than 0', () => {
    expect(testServerRedirect({ slugInURL: `${addon.id}` })).toBeTruthy();
  });

  // The reason for this test case came from https://github.com/mozilla/addons-frontend/issues/4541.
  it('does not dispatch a server redirect when slug is a stringified integer less than 0', () => {
    addon.slug = '-1234';
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': SEND_SERVER_REDIRECT }),
    );
  });

  // See: https://github.com/mozilla/addons-frontend/issues/4271.
  it(`dispatches a server redirect when slug param case does not match the add-on's slug case`, () => {
    expect(
      testServerRedirect({ slugInURL: defaultSlug.toUpperCase() }),
    ).toBeTruthy();
  });

  it(`dispatches a server redirect when slug is the add-on's GUID`, () => {
    expect(testServerRedirect({ slugInURL: addon.guid })).toBeTruthy();
  });

  it(`dispatches a server redirect when slug contains very similar characters`, () => {
    // We change the slug to simulate an API response for a slug that isn't
    // strictly the add-on's slug.
    expect(testServerRedirect({ slugInURL: 'rëviewed-âdd-õn' })).toBeTruthy();
  });

  it(`dispatches a server redirect when slug is the add-on's GUID using a different case`, () => {
    // We change the GUID case and simulate the loading of an URL containing
    // that slug in uppercase.
    expect(
      testServerRedirect({ slugInURL: addon.guid.toUpperCase() }),
    ).toBeTruthy();
  });

  it('renders html as plaintext', () => {
    const summaryText = '<script>alert(document.cookie);</script>';
    addon.summary = createLocalizedString(summaryText);
    renderWithAddon();

    // Verify that the summary text exists without the script tag.
    expect(screen.getByText(summaryText)).toBeInTheDocument();
    // Verify that no script tags exist in the summary.
    const addonSummary = screen.getByClassName('Addon-summary');
    expect(
      within(addonSummary).queryByTagName('script'),
    ).not.toBeInTheDocument();
  });

  // This is a test helper that can be used to test the integration between
  // a ShowMoreCard and contentId.
  const testContentId = async ({
    addonProp,
    addonPropValue,
    cardClassName,
  }) => {
    // Mock the clientHeight so the "read more" link will be present.
    mockClientHeight(301);
    renderWithAddon();

    const card = screen.getByClassName(cardClassName);
    expect(card).not.toHaveClass('ShowMoreCard--expanded');

    // Click the link to expand the ShowMoreCard.
    await userEvent.click(
      within(card).getByRole('link', {
        name: 'Expand to read more',
      }),
    );

    // It should be expanded now.
    expect(card).toHaveClass('ShowMoreCard--expanded');

    // Update with the same version id, which should change nothing.
    _loadAddon();

    // It should still be expanded.
    await waitFor(() => expect(card).toHaveClass('ShowMoreCard--expanded'));

    // Update the add-on to generate a different contentId.
    addon[addonProp] = addonPropValue;
    _loadAddon();

    // It should revert to not being expanded.
    await waitFor(() => expect(card).not.toHaveClass('ShowMoreCard--expanded'));

    return true;
  };

  it('passes the expected contentId to ShowMoreCard for description', async () => {
    expect(
      await testContentId({
        addonProp: 'id',
        addonPropValue: addon.id + 1,
        cardClassName: 'AddonDescription',
      }),
    ).toBeTruthy();
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'extension'],
    [ADDON_TYPE_STATIC_THEME, 'theme'],
    [ADDON_TYPE_DICT, 'dictionary'],
    [ADDON_TYPE_LANG, 'language pack'],
    ['generic-type', 'add-on'],
  ])('sets a title for the description of a(n) %s', (type, title) => {
    addon.type = type;
    renderWithAddon();

    expect(screen.getByText(`About this ${title}`)).toBeInTheDocument();
  });

  it('hides the description if description and summary are null', () => {
    addon.description = null;
    addon.summary = null;
    renderWithAddon();

    expect(screen.queryByClassName('AddonDescription')).not.toBeInTheDocument();
  });

  it('hides the description if description and summary are blank', () => {
    addon.description = createLocalizedString('');
    addon.summary = createLocalizedString('');
    renderWithAddon();

    expect(screen.queryByClassName('AddonDescription')).not.toBeInTheDocument();
  });

  it("displays a static theme's description", () => {
    const description = 'some cool description';
    addon.type = ADDON_TYPE_STATIC_THEME;
    addon.summary = createLocalizedString('my theme is very cool');
    addon.description = createLocalizedString(description);
    renderWithAddon();

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'extension'],
    [ADDON_TYPE_STATIC_THEME, 'theme'],
    [ADDON_TYPE_DICT, 'dictionary'],
    [ADDON_TYPE_LANG, 'language pack'],
    ['generic-type', 'add-on'],
  ])('does not display a description if a(n) %s has no description', (type) => {
    addon.type = type;
    addon.summary = createLocalizedString('my add-on is very cool');
    addon.description = null;
    renderWithAddon();

    expect(screen.queryByClassName('AddonDescription')).not.toBeInTheDocument();
  });

  it("displays the extension's description when both description and summary are supplied", () => {
    const description = 'some cool description';
    addon.type = ADDON_TYPE_EXTENSION;
    addon.summary = createLocalizedString('my theme is very cool');
    addon.description = createLocalizedString(description);
    renderWithAddon();

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('converts new lines in the description to breaks', () => {
    addon.description = createLocalizedString('Hello\nI am an\n add-on.');
    renderWithAddon();

    const addonDescription = screen.getByClassName('AddonDescription');
    expect(within(addonDescription).queryAllByTagName('br')).toHaveLength(2);
  });

  it('allows some HTML tags in the description', () => {
    addon.description = createLocalizedString(
      '<b>super</b> <i>cool</i> <blink>add-on</blink>',
    );
    renderWithAddon();

    const addonDescription = screen.getByClassName('AddonDescription');
    expect(within(addonDescription).queryAllByTagName('b')).toHaveLength(1);
    expect(within(addonDescription).queryAllByTagName('i')).toHaveLength(1);
    expect(
      within(addonDescription).queryByTagName('blink'),
    ).not.toBeInTheDocument();
    expect(screen.getByTextAcrossTags('super cool add-on')).toBeInTheDocument();
  });

  it('strips dangerous HTML tag attributes from description', () => {
    const placeholder = 'some placeholder text';
    addon.description = createLocalizedString(
      `<a href="javascript:alert(document.cookie)" onclick="sneaky()">${placeholder}</a>`,
    );
    renderWithAddon();

    expect(screen.getByText(placeholder)).toBeInTheDocument();
  });

  it('hides developer comments if null', () => {
    addon.developer_comments = null;
    renderWithAddon();

    expect(screen.queryByText('Developer comments')).not.toBeInTheDocument();
  });

  it('shows the developer comments if present and description and summary are blank', () => {
    addon.description = createLocalizedString('');
    addon.summary = createLocalizedString('');
    addon.developer_comments = createLocalizedString('Foo');
    renderWithAddon();

    expect(screen.getByText('Developer comments')).toBeInTheDocument();
  });

  it('shows the developer comments if present and description and summary are null', () => {
    addon.description = null;
    addon.summary = null;
    addon.developer_comments = createLocalizedString('Foo');
    renderWithAddon();

    expect(screen.getByText('Developer comments')).toBeInTheDocument();
  });

  it('shows the developer comments if present and description is null without duplicating summary', () => {
    addon.description = null;
    addon.summary = createLocalizedString('Bar');
    addon.developer_comments = createLocalizedString('Foo');
    renderWithAddon();

    expect(screen.getByText('Developer comments')).toBeInTheDocument();
    expect(
      screen.queryByClassName('AddonDescription-contents'),
    ).not.toBeInTheDocument();
  });

  it('displays developer comments', () => {
    const developerComments = 'some awesome developers comments';
    addon.developer_comments = createLocalizedString(developerComments);
    renderWithAddon();

    expect(screen.getByText('Developer comments')).toBeInTheDocument();
    expect(screen.getByText(developerComments)).toBeInTheDocument();
  });

  it('allows some HTML tags in the developer comments', () => {
    addon.developer_comments = createLocalizedString(
      '<b>super</b> <i>cool</i> <blink>comments</blink>',
    );
    renderWithAddon();

    const developerComments = screen.getByClassName('Addon-developer-comments');
    expect(within(developerComments).queryAllByTagName('b')).toHaveLength(1);
    expect(within(developerComments).queryAllByTagName('i')).toHaveLength(1);
    expect(
      within(developerComments).queryByTagName('blink'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTextAcrossTags('super cool comments'),
    ).toBeInTheDocument();
  });

  it('configures the RatingManager', async () => {
    dispatchSignInActionsWithStore({ store, userId: authorUserId });
    store.dispatch(
      setLatestReview({
        addonId: addon.id,
        review: null,
        userId: authorUserId,
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithAddon();

    await userEvent.click(screen.getByTitle('Rate this add-on 1 out of 5'));

    expect(dispatch).toHaveBeenCalledWith(
      createAddonReview({
        addonId: addon.id,
        errorHandlerId: 'RatingManager',
        score: 1,
        versionId: fakeVersion.id,
      }),
    );
  });

  it('does not show a RatingManager without a version', () => {
    addon.current_version = null;
    renderWithAddon();

    expect(
      screen.getByClassName('Addon-no-rating-manager'),
    ).toBeInTheDocument();
  });

  it('renders a summary', () => {
    const summary = 'some summary';
    addon.summary = createLocalizedString(summary);
    renderWithAddon();

    expect(screen.getByText(summary)).toBeInTheDocument();
  });

  it('does not render links in a summary', () => {
    const linkText = 'click me!';
    const summaryText = `blah blah <a href="http://foo.com/">${linkText}</a>`;
    addon.summary = createLocalizedString(summaryText);
    renderWithAddon();

    expect(screen.getByTextAcrossTags(summaryText)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: linkText }),
    ).not.toBeInTheDocument();
  });

  it('renders an amo icon image', () => {
    const addonName = 'some-addon-name';
    addon.name = createLocalizedString(addonName);
    addon.icons[64] = 'https://addons.mozilla.org/foo.jpg';
    renderWithAddon();

    expect(screen.getByAltText(`Preview of ${addonName}`)).toHaveAttribute(
      'src',
      addon.icons[64],
    );
  });

  it('renders screenshots for type extension', () => {
    addon.type = ADDON_TYPE_EXTENSION;
    renderWithAddon();

    expect(screen.getByText('Screenshots')).toBeInTheDocument();
  });

  it('hides screenshots for static theme type', () => {
    addon.type = ADDON_TYPE_STATIC_THEME;
    renderWithAddon();

    expect(screen.queryByText('Screenshots')).not.toBeInTheDocument();
  });

  it('uses Addon-theme class if it is a static theme', () => {
    addon.type = ADDON_TYPE_STATIC_THEME;
    renderWithAddon();

    expect(screen.queryByClassName('Addon')).toHaveClass('Addon-theme');
  });

  it('passes the addon to AddonCompatibilityError', () => {
    getClientCompatibility.mockReturnValue(
      createFakeClientCompatibility({
        compatible: false,
        reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      }),
    );
    renderWithAddon();

    expect(
      screen.getByText('This add-on is not available on your platform.'),
    ).toBeInTheDocument();
  });

  it('renders an AddonMoreInfo component when there is an add-on', () => {
    // The AddonMoreInfo component will display a Homepage if one exists.
    addon.homepage = {
      url: createLocalizedString('http://hamsterdance.com/'),
      outgoing: createLocalizedString('https://outgoing.mozilla.org/hamster'),
    };
    renderWithAddon();

    expect(screen.getByText('Homepage')).toHaveAttribute(
      'href',
      'https://outgoing.mozilla.org/hamster',
    );
  });

  it('renders meta data for the add-on', () => {
    renderWithAddon();

    expect(screen.getByRole('link', { name: 'Reviews' })).toBeInTheDocument();
  });

  describe('read reviews footer', () => {
    const renderWithRatings = (count) => {
      addon.ratings = { ...fakeAddon.ratings, count };
      renderWithAddon();
    };

    it('only links to reviews when they exist', () => {
      renderWithRatings(0);

      const readReviewsFooter = screen.getByText('No reviews yet');
      expect(readReviewsFooter).toHaveClass('Addon-read-reviews-footer');
      expect(
        within(readReviewsFooter).queryByRole('link'),
      ).not.toBeInTheDocument();
    });

    it('prompts you to read one review', () => {
      renderWithRatings(1);

      expect(
        screen.getByRole('link', { name: 'Read 1 review' }),
      ).toBeInTheDocument();
    });

    it('prompts you to read many reviews', () => {
      renderWithRatings(5);

      expect(
        screen.getByRole('link', { name: 'Read all 5 reviews' }),
      ).toBeInTheDocument();
    });

    it('localizes the review count', () => {
      renderWithRatings(10000);

      expect(
        screen.getByRole('link', { name: 'Read all 10,000 reviews' }),
      ).toBeInTheDocument();
    });

    it('links to all reviews', () => {
      renderWithRatings(2);

      expect(
        screen.getByRole('link', { name: 'Read all 2 reviews' }),
      ).toHaveAttribute(
        'href',
        `/${lang}/${clientApp}${reviewListURL({ addonSlug: defaultSlug })}`,
      );
    });

    it('adds UTM query parameters to the all reviews link when there are some', () => {
      const utmCampaign = 'some-utm-campaign';
      addon.ratings = { ...fakeAddon.ratings, count: 2 };
      renderWithAddon({
        location: `${getLocation()}?utm_campaign=${utmCampaign}`,
      });

      expect(
        screen.getByRole('link', { name: 'Read all 2 reviews' }),
      ).toHaveAttribute(
        'href',
        `/${lang}/${clientApp}${reviewListURL({
          addonSlug: defaultSlug,
        })}?utm_campaign=${utmCampaign}`,
      );
    });
  });

  describe('version release notes', () => {
    const renderWithVersion = (props = {}) => {
      addon.current_version = { ...fakeVersion, ...props };
      renderWithAddon();
    };

    it('is hidden when an add-on has not loaded yet', () => {
      render();

      expect(
        screen.queryByClassName('AddonDescription-version-notes'),
      ).not.toBeInTheDocument();
    });

    it('is hidden when the add-on does not have a current version', () => {
      addon.current_version = null;
      renderWithAddon();

      expect(
        screen.queryByClassName('AddonDescription-version-notes'),
      ).not.toBeInTheDocument();
    });

    it('is hidden when the current version does not have release notes', () => {
      renderWithVersion({ release_notes: null });

      expect(
        screen.queryByClassName('AddonDescription-version-notes'),
      ).not.toBeInTheDocument();
    });

    it('passes the expected contentId to ShowMoreCard', async () => {
      expect(
        await testContentId({
          addonProp: 'id',
          addonPropValue: addon.id + 1,
          cardClassName: 'AddonDescription-version-notes',
        }),
      ).toBeTruthy();
    });

    it('shows the version string', () => {
      const version = 'v1.4.5';
      renderWithVersion({ version });

      expect(screen.getByText('Release notes for v1.4.5')).toBeInTheDocument();
    });

    it('shows the release notes', () => {
      const releaseNotes = 'Fixed some stuff';
      renderWithVersion({
        release_notes: createLocalizedString(releaseNotes),
      });

      expect(screen.getByText(releaseNotes)).toBeInTheDocument();
    });

    it('allows some HTML tags', () => {
      const releaseNotes = '<b>lots</b> <i>of</i> <blink>bug fixes</blink>';
      renderWithVersion({
        release_notes: createLocalizedString(releaseNotes),
      });

      const notesCard = screen.getByClassName('AddonDescription-version-notes');

      expect(
        screen.getByTextAcrossTags('lots of bug fixes'),
      ).toBeInTheDocument();
      expect(within(notesCard).getByTagName('b')).toHaveTextContent('lots');
      expect(within(notesCard).getByTagName('i')).toHaveTextContent('of');
    });

    it('allows some ul-li tags', () => {
      const releaseNotes = '<b>The List</b><ul><li>one</li><li>two</li></ul>';
      renderWithVersion({
        release_notes: createLocalizedString(releaseNotes),
      });

      const notesCard = screen.getByClassName('AddonDescription-version-notes');

      expect(
        within(notesCard).getByTextAcrossTags('The Listonetwo'),
      ).toBeInTheDocument();
      expect(within(notesCard).getByRole('list')).toBeInTheDocument();
      expect(within(notesCard).getAllByRole('listitem')[0]).toHaveTextContent(
        'one',
      );
      expect(within(notesCard).getAllByRole('listitem')[1]).toHaveTextContent(
        'two',
      );
    });
  });

  it('renders the site identifier as a data attribute', () => {
    renderWithAddon();

    expect(screen.getByClassName('Addon')).toHaveAttribute(
      'data-site-identifier',
      String(addon.id),
    );
  });

  describe('errorHandler - extractId', () => {
    it('generates a unique ID based on the add-on slug', () => {
      expect(extractId({ match: { params: { slug: 'some-slug' } } })).toEqual(
        'some-slug',
      );
    });
  });

  describe('InstallButtonWrapper', () => {
    it('passes the addon to the InstallButtonWrapper', () => {
      renderWithAddon();

      expect(
        screen.getByRole('link', { name: 'Add to Firefox' }),
      ).toHaveAttribute('href', fakeVersion.file.url);
    });
  });

  const nonPublicNotice =
    `This is not a public listing. You are only seeing it because of ` +
    `elevated permissions.`;

  // Non-public add-ons require an account listed as a developer of the add-on
  // or admin rights.
  it('displays a notice to admin/developer when add-on is not fully reviewed', () => {
    addon.status = 'disabled';
    renderWithAddon();

    expect(screen.getByText(nonPublicNotice)).toBeInTheDocument();
  });

  it('does not display a notice when add-on is fully reviewed', () => {
    addon.status = 'public';
    renderWithAddon();

    expect(screen.queryByText(nonPublicNotice)).not.toBeInTheDocument();
  });

  // Non-public add-ons require an account listed as a developer of the add-on
  // or admin rights.
  it('displays a notice to admin/developer when an add-on is disabled', () => {
    addon.is_disabled = true;
    renderWithAddon();

    expect(screen.getByText(nonPublicNotice)).toBeInTheDocument();
  });

  it('does not display a notice when add-on is not disabled', () => {
    addon.is_disabled = false;
    renderWithAddon();

    expect(screen.queryByText(nonPublicNotice)).not.toBeInTheDocument();
  });

  it('passes an error to the AddonInstallError component', () => {
    // User clicks the install button.
    store.dispatch(
      setInstallState({
        guid: addon.guid,
        status: INSTALLING,
      }),
    );
    // An error has occurred in FF.
    store.dispatch(setInstallError({ error: FATAL_ERROR, guid: addon.guid }));

    renderWithAddon();

    expect(
      within(screen.getByClassName('AddonInstallError')).getByText(
        'An unexpected error occurred.',
      ),
    ).toBeInTheDocument();
  });

  describe('InstallWarning', () => {
    it('renders the InstallWarning if an add-on exists', () => {
      correctedLocationForPlatform.mockReturnValue('');
      renderWithAddon();

      expect(
        screen.getByText(
          `This add-on is not actively monitored for security by Mozilla. ` +
            `Make sure you trust it before installing.`,
        ),
      ).toBeInTheDocument();
    });

    it('does not render the InstallWarning if an add-on does not exist', () => {
      correctedLocationForPlatform.mockReturnValue('');
      render();

      expect(
        screen.queryByText(
          `This add-on is not actively monitored for security by Mozilla. ` +
            `Make sure you trust it before installing.`,
        ),
      ).not.toBeInTheDocument();
    });

    it('passes the addon to the InstallWarning', () => {
      // Rendering with a static theme will cause the InstallWarning to not be shown.
      correctedLocationForPlatform.mockReturnValue('');
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      expect(
        screen.queryByText(
          `This add-on is not actively monitored for security by Mozilla. ` +
            `Make sure you trust it before installing.`,
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for ThemeImage', () => {
    it('renders a theme image when add-on is a static theme', () => {
      const addonName = 'Some add-on name';
      addon.name = createLocalizedString(addonName);
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      const addonImage = screen.getByAltText(`Preview of ${addonName}`);
      expect(addonImage).toHaveAttribute('src', addon.previews[0].src);
      expect(addonImage).toHaveClass('ThemeImage-image');
    });

    it('does not render a theme image when there is no add-on', () => {
      render();

      expect(
        screen.queryByClassName('ThemeImage-image'),
      ).not.toBeInTheDocument();
    });

    it('does not render a theme image when add-on is not a static theme', () => {
      addon.type = ADDON_TYPE_EXTENSION;
      renderWithAddon();

      expect(
        screen.queryByClassName('ThemeImage-image'),
      ).not.toBeInTheDocument();
    });

    it('renders a theme image with rounded corners', () => {
      const addonName = 'Some add-on name';
      addon.name = createLocalizedString(addonName);
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      expect(screen.getByRole('presentation')).toHaveClass(
        'ThemeImage--rounded-corners',
      );
    });

    it('displays a preview with 720 width', () => {
      const fullImage720 = `https://addons.mozilla.org/user-media/full/720.png`;
      const addonName = 'Some add-on name';
      addon.name = createLocalizedString(addonName);
      addon.type = ADDON_TYPE_STATIC_THEME;
      addon.previews = [
        {
          ...fakePreview,
          image_size: [600, 500],
        },
        {
          ...fakePreview,
          image_size: [720, 500],
          image_url: fullImage720,
        },
      ];
      renderWithAddon();

      expect(screen.getByAltText(`Preview of ${addonName}`)).toHaveAttribute(
        'src',
        fullImage720,
      );
    });
  });

  describe('Tests for AddonAdminLinks', () => {
    it('shows Admin Links if the user has permission for a link', () => {
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
    });

    it('does not show Admin Links if there is no add-on', () => {
      renderWithPermissions({
        shouldLoadAddon: false,
        permissions: ADDONS_EDIT,
      });

      expect(screen.queryByText('Admin Links')).not.toBeInTheDocument();
    });

    it('does not show Admin Links if the user does not have permission for a link', () => {
      renderWithAddon();

      expect(screen.queryByText('Admin Links')).not.toBeInTheDocument();
    });

    it('shows edit and admin add-on links if the user has permission', () => {
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByRole('link', { name: 'Edit add-on' })).toHaveAttribute(
        'href',
        `/developers/addon/${defaultSlug}/edit`,
      );
      expect(
        screen.getByRole('link', { name: 'Admin add-on' }),
      ).toHaveAttribute('href', `/admin/models/addons/addon/${defaultAddonId}`);
    });

    it('does not show an edit or admin add-on link if the user does not have permission', () => {
      renderWithPermissions({ permissions: ADDONS_REVIEW });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(screen.queryByText('Edit add-on')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin add-on')).not.toBeInTheDocument();
    });

    it('shows a content review link if the user has permission', () => {
      renderWithPermissions({ permissions: ADDONS_CONTENT_REVIEW });

      expect(
        screen.getByRole('link', { name: 'Content review add-on' }),
      ).toHaveAttribute('href', `/reviewers/review-content/${defaultAddonId}`);
    });

    it('does not show a content review link if the user does not have permission', () => {
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(
        screen.queryByText('Content review add-on'),
      ).not.toBeInTheDocument();
    });

    it('does not show a content review link for a theme', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithPermissions({
        permissions: [ADDONS_CONTENT_REVIEW, ADDONS_EDIT],
      });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(
        screen.queryByText('Content review add-on'),
      ).not.toBeInTheDocument();
    });

    it.each([ADDONS_REVIEW, REVIEWER_TOOLS_VIEW])(
      'shows a code review link for an extension if the user has the %s permission',
      (permission) => {
        renderWithPermissions({ permissions: [permission] });

        expect(
          screen.getByRole('link', { name: 'Review add-on code' }),
        ).toHaveAttribute('href', `/reviewers/review/${defaultAddonId}`);
      },
    );

    it('does not show a code review link if the user does not have permission', () => {
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(screen.queryByText('Review add-on code')).not.toBeInTheDocument();
    });

    it('shows a theme review link for a static theme if the user has permission', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithPermissions({ permissions: STATIC_THEMES_REVIEW });

      expect(
        screen.getByRole('link', { name: 'Review theme' }),
      ).toHaveAttribute('href', `/reviewers/review/${defaultAddonId}`);
    });

    it('does not show a theme review link if the user does not have permission', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(screen.queryByText('Review theme')).not.toBeInTheDocument();
    });

    it('does not show a theme review link if the user has permission but the add-on is not a theme', () => {
      renderWithPermissions({
        permissions: [ADDONS_EDIT, STATIC_THEMES_REVIEW],
      });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(screen.queryByText('Review theme')).not.toBeInTheDocument();
    });
  });

  describe('Tests for AddonAuthorLinks', () => {
    it('shows an edit add-on link if the user is author', () => {
      dispatchSignInActionsWithStore({ store, userId: authorUserId });
      renderWithAddon();

      expect(screen.getByText('Author Links')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Edit add-on' })).toHaveAttribute(
        'href',
        `/developers/addon/${defaultSlug}/edit`,
      );
    });

    it('does not show Author Links if the user is not logged in', () => {
      renderWithAddon();

      expect(screen.queryByText('Author Links')).not.toBeInTheDocument();
    });

    it('does not show Author Links if a signed-in user is not the author of the add-on', () => {
      dispatchSignInActionsWithStore({ store, userId: authorUserId + 1 });
      renderWithAddon();

      expect(screen.queryByText('Author Links')).not.toBeInTheDocument();
    });

    it('does not show Author Links if there is no add-on', () => {
      dispatchSignInActionsWithStore({ store, userId: authorUserId });
      render();

      expect(screen.queryByText('Author Links')).not.toBeInTheDocument();
    });
  });

  describe('Tests for AddonHead', () => {
    const addonName = 'Some add-on name';

    it('renders links via the HeadLinks component', async () => {
      renderWithAddon();

      await waitFor(() =>
        expect(getElement('link[rel="canonical"]')).toHaveAttribute(
          'href',
          getCanonicalURL({ locationPathname: getLocation() }),
        ),
      );
    });

    it('renders meta tags via the HeadMetaTags component', async () => {
      const summary = 'An add-on summary';
      addon.name = createLocalizedString(addonName);
      addon.summary = createLocalizedString(summary);
      renderWithAddon();

      await waitFor(() =>
        expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
      );

      expect(getElement('meta[name="date"]')).toHaveAttribute(
        'content',
        String(addon.created),
      );
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        `Download ${addonName} for Firefox. ${summary}`,
      );
      expect(getElement(`meta[property="og:image"]`)).toHaveAttribute(
        'content',
        addon.previews[0].src,
      );
      expect(getElement('meta[name="last-modified"]')).toHaveAttribute(
        'content',
        String(addon.created),
      );
    });

    it.each([
      [ADDON_TYPE_DICT, 'Dictionary'],
      [ADDON_TYPE_EXTENSION, 'Extension'],
      [ADDON_TYPE_LANG, 'Language Pack'],
      [ADDON_TYPE_STATIC_THEME, 'Theme'],
    ])(
      'renders an HTML title for Firefox (add-on type: %s)',
      async (type, name) => {
        addon.name = createLocalizedString(addonName);
        addon.type = type;
        renderWithAddon();

        await waitFor(() =>
          expect(getElement('title')).toHaveTextContent(
            `${addonName} – Get this ${name} for 🦊 Firefox (${lang})`,
          ),
        );
      },
    );

    it.each([
      [ADDON_TYPE_DICT, 'Dictionary'],
      [ADDON_TYPE_EXTENSION, 'Extension'],
      [ADDON_TYPE_LANG, 'Language Pack'],
      [ADDON_TYPE_STATIC_THEME, 'Theme'],
    ])(
      'renders an HTML title for Android (add-on type: %s)',
      async (type, name) => {
        addon.name = createLocalizedString(addonName);
        addon.type = type;
        dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, lang, store });
        renderWithAddon({
          location: `/${lang}/${CLIENT_APP_ANDROID}/addon/${defaultSlug}/`,
        });

        await waitFor(() =>
          expect(getElement('title')).toHaveTextContent(
            `${addonName} – Get this ${name} for 🦊 Firefox Android (${lang})`,
          ),
        );
      },
    );

    it('renders JSON linked data', async () => {
      _loadAddon();
      const internalAddon = getAddonByIdInURL(
        store.getState().addons,
        defaultSlug,
      );
      const currentVersion = getVersionById({
        id: internalAddon.currentVersionId,
        state: store.getState().versions,
      });
      render();

      await waitFor(() =>
        expect(
          getElement('script[type="application/ld+json"]'),
        ).toBeInTheDocument(),
      );

      expect(
        getElement('script[type="application/ld+json"]'),
      ).toHaveTextContent(
        serialize(
          getAddonJsonLinkedData({ addon: internalAddon, currentVersion }),
          {
            isJSON: true,
          },
        ),
      );
    });

    it('escapes JSON linked data', async () => {
      const dangerousName = '<script>';
      addon.name = createLocalizedString(dangerousName);
      renderWithAddon();

      await waitFor(() =>
        expect(
          getElement('script[type="application/ld+json"]'),
        ).toBeInTheDocument(),
      );

      expect(
        getElement('script[type="application/ld+json"]'),
      ).toHaveTextContent(/\\u003Cscript\\u003E/);
    });
  });

  describe('Tests for ContributeCard', () => {
    const url = 'https://paypal.me/babar';
    const outgoing = 'https://outgoing.mozilla.org/qqq';
    const contributionsURL = { url, outgoing };

    it('does not render anything if no add-on supplied', () => {
      render();

      expect(screen.queryByText('Contribute now')).not.toBeInTheDocument();
    });

    it('does not render anything if add-on has no contributions URL', () => {
      addon.contributions_url = null;
      renderWithAddon();

      expect(screen.queryByText('Contribute now')).not.toBeInTheDocument();
    });

    it('renders a Button with a contributions URL', () => {
      addon.contributions_url = contributionsURL;
      renderWithAddon();

      expect(screen.getByText('Contribute now')).toBeInTheDocument();
      const link = screen.getByTitle(url);
      expect(link).toHaveAttribute('href', outgoing);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveTextContent('Contribute now');
    });

    it('displays content for an extension developer', () => {
      addon.contributions_url = contributionsURL;
      renderWithAddon();

      expect(screen.getByText('Support this developer')).toBeInTheDocument();
      expect(
        screen.getByText(
          `The developer of this extension asks that you help support its ` +
            `continued development by making a small contribution.`,
        ),
      ).toBeInTheDocument();
    });

    it('displays content for multiple extension developers', () => {
      addon.authors = Array(3).fill(fakeAddon.authors[0]);
      addon.contributions_url = contributionsURL;
      renderWithAddon();

      expect(screen.getByText('Support these developers')).toBeInTheDocument();
      expect(
        screen.getByText(
          `The developers of this extension ask that you help support its ` +
            `continued development by making a small contribution.`,
        ),
      ).toBeInTheDocument();
    });

    it('displays content for a theme artist', () => {
      addon.contributions_url = contributionsURL;
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      expect(screen.getByText('Support this artist')).toBeInTheDocument();
      expect(
        screen.getByText(
          `The artist of this theme asks that you help support its continued ` +
            `creation by making a small contribution.`,
        ),
      ).toBeInTheDocument();
    });

    it('displays content for multiple theme artists', () => {
      addon.authors = Array(3).fill(fakeAddon.authors[0]);
      addon.contributions_url = contributionsURL;
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      expect(screen.getByText('Support these artists')).toBeInTheDocument();
      expect(
        screen.getByText(
          `The artists of this theme ask that you help support its continued ` +
            `creation by making a small contribution.`,
        ),
      ).toBeInTheDocument();
    });

    it('displays content for a add-on author', () => {
      addon.contributions_url = contributionsURL;
      addon.type = ADDON_TYPE_LANG;
      renderWithAddon();

      expect(screen.getByText('Support this author')).toBeInTheDocument();
      expect(
        screen.getByText(
          `The author of this add-on asks that you help support its ` +
            `continued work by making a small contribution.`,
        ),
      ).toBeInTheDocument();
    });

    it('displays content for multiple add-on authors', () => {
      addon.authors = Array(3).fill(fakeAddon.authors[0]);
      addon.contributions_url = contributionsURL;
      addon.type = ADDON_TYPE_LANG;
      renderWithAddon();

      expect(screen.getByText('Support these authors')).toBeInTheDocument();
      expect(
        screen.getByText(
          `The authors of this add-on ask that you help support its ` +
            `continued work by making a small contribution.`,
        ),
      ).toBeInTheDocument();
    });

    it('sends a tracking event when the button is clicked', async () => {
      addon.contributions_url = contributionsURL;
      renderWithAddon();
      tracking.sendEvent.mockClear();

      await userEvent.click(screen.getByTitle(url));

      expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
      expect(tracking.sendEvent).toHaveBeenCalledWith({
        action: CONTRIBUTE_BUTTON_CLICK_ACTION,
        category: CONTRIBUTE_BUTTON_CLICK_CATEGORY,
        label: addon.guid,
      });
    });
  });

  describe('Tests for PermissionsCard', () => {
    const getPermissionsCard = () => screen.getByClassName('PermissionsCard');

    describe('no permissions', () => {
      it('renders nothing without a version', () => {
        addon.current_version = null;
        renderWithAddon();

        expect(
          screen.queryByText('Permissions and data'),
        ).not.toBeInTheDocument();
      });

      it('renders nothing for a version with no permissions', () => {
        addon.current_version = createVersionWithPermissions();
        renderWithAddon();

        expect(
          screen.queryByText('Permissions and data'),
        ).not.toBeInTheDocument();
      });

      it('renders nothing for a version with no displayable permissions', () => {
        addon.current_version = createVersionWithPermissions({
          optional: ['activeTab'],
          required: ['activeTab'],
        });
        renderWithAddon();

        expect(
          screen.queryByText('Permissions and data'),
        ).not.toBeInTheDocument();
      });
    });

    describe('with permissions', () => {
      it('passes the expected contentId to ShowMoreCard', async () => {
        expect(
          await testContentId({
            addonProp: 'current_version',
            addonPropValue: createVersionWithPermissions({
              required: ['bookmarks'],
              versionProps: { id: addon.current_version.id + 1 },
            }),
            cardClassName: 'PermissionsCard',
          }),
        ).toBeTruthy();
      });

      it('renders learn more link in header', () => {
        addon.current_version = createVersionWithPermissions({
          required: ['bookmarks'],
        });
        renderWithAddon();

        expect(screen.getByText('Permissions and data')).toBeInTheDocument();
        const learnMoreLink = within(getPermissionsCard()).getByText(
          'Learn more',
        );
        expect(learnMoreLink).toHaveAttribute(
          'href',
          'https://support.mozilla.org/kb/permission-request-messages-firefox-extensions',
        );
        expect(
          within(learnMoreLink).getByClassName('Icon-external-dark'),
        ).toBeInTheDocument();
      });

      it('renders required permissions only', () => {
        addon.current_version = createVersionWithPermissions({
          required: ['bookmarks'],
        });
        renderWithAddon();

        expect(screen.getByText('Required permissions:')).toHaveClass(
          'PermissionsCard-subhead--required',
        );
        expect(within(getPermissionsCard()).getByTagName('ul')).toHaveClass(
          'PermissionsCard-list--required',
        );
        expect(
          screen.getByText('Read and modify bookmarks'),
        ).toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-subhead--optional'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-list--optional'),
        ).not.toBeInTheDocument();
      });

      it('renders optional permissions only', () => {
        addon.current_version = createVersionWithPermissions({
          host: ['*://example.com/*'],
          optional: ['bookmarks'],
        });
        renderWithAddon();

        expect(screen.getByText('Optional permissions:')).toHaveClass(
          'PermissionsCard-subhead--optional',
        );
        expect(within(getPermissionsCard()).getByTagName('ul')).toHaveClass(
          'PermissionsCard-list--optional',
        );
        expect(
          screen.getByText('Access your data for example.com'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Read and modify bookmarks'),
        ).toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-subhead--required'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-list--required'),
        ).not.toBeInTheDocument();
      });

      it('renders both optional and required permissions', () => {
        addon.current_version = createVersionWithPermissions({
          host: ['*://example.com/*'],
          optional: ['bookmarks'],
          required: ['history'],
        });
        renderWithAddon();

        expect(screen.getByText('Required permissions:')).toHaveClass(
          'PermissionsCard-subhead--required',
        );
        expect(screen.getByText('Optional permissions:')).toHaveClass(
          'PermissionsCard-subhead--optional',
        );
        expect(
          screen.getByText('Access your data for example.com'),
        ).toBeInTheDocument();
        expect(screen.getByText('Access browsing history')).toBeInTheDocument();
        expect(
          screen.getByText('Read and modify bookmarks'),
        ).toBeInTheDocument();
        expect(
          screen.getByClassName('PermissionsCard-list--required'),
        ).toBeInTheDocument();
        expect(
          screen.getByClassName('PermissionsCard-list--optional'),
        ).toBeInTheDocument();
      });
    });

    describe('with data collection permissions', () => {
      it('renders required permissions only', () => {
        addon.current_version = createVersionWithPermissions({
          required_data_collection: ['searchTerms'],
        });
        renderWithAddon();

        expect(
          screen.getByText(
            'Required data collection, according to the developer:',
          ),
        ).toHaveClass('PermissionsCard-subhead--required');
        expect(within(getPermissionsCard()).getByTagName('ul')).toHaveClass(
          'PermissionsCard-list--required',
        );
        expect(screen.getByText('Search terms')).toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-subhead--optional'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-list--optional'),
        ).not.toBeInTheDocument();
      });

      it('renders optional permissions only', () => {
        addon.current_version = createVersionWithPermissions({
          optional_data_collection: ['technicalAndInteraction'],
        });
        renderWithAddon();

        expect(
          screen.getByText(
            'Optional data collection, according to the developer:',
          ),
        ).toHaveClass('PermissionsCard-subhead--optional');
        expect(within(getPermissionsCard()).getByTagName('ul')).toHaveClass(
          'PermissionsCard-list--optional',
        );
        expect(
          screen.getByText('Technical and interaction data'),
        ).toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-subhead--required'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByClassName('PermissionsCard-list--required'),
        ).not.toBeInTheDocument();
      });

      it('renders both optional and required permissions', () => {
        addon.current_version = createVersionWithPermissions({
          required_data_collection: ['authenticationInfo'],
          optional_data_collection: ['websiteContent'],
        });
        renderWithAddon();

        expect(
          screen.getByText(
            'Required data collection, according to the developer:',
          ),
        ).toHaveClass('PermissionsCard-subhead--required');
        expect(
          screen.getByText(
            'Optional data collection, according to the developer:',
          ),
        ).toHaveClass('PermissionsCard-subhead--optional');
        expect(screen.getByText('Website content')).toBeInTheDocument();
        expect(
          screen.getByClassName('PermissionsCard-list--required'),
        ).toBeInTheDocument();
        expect(
          screen.getByClassName('PermissionsCard-list--optional'),
        ).toBeInTheDocument();
      });

      it('renders the special "none" data collection permission changing the header', () => {
        addon.current_version = createVersionWithPermissions({
          required_data_collection: ['none'],
        });
        renderWithAddon();

        expect(screen.getByText('Data collection:')).toHaveClass(
          'PermissionsCard-subhead--required',
        );
        expect(
          screen.getByText(
            "The developer says this extension doesn't require data collection.",
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Tests for HostPermissions', () => {
    it('formats domain permissions', () => {
      addon.current_version = createVersionWithPermissions({
        required: [
          '*://*.mozilla.org/*',
          '*://*.mozilla.com/*',
          '*://*.mozilla.ca/*',
          '*://*.mozilla.us/*',
        ],
        host: ['*://*.mozilla.co.nz/*', '*://*.mozilla.co.uk/*'],
      });
      renderWithAddon();

      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.org domain',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.com domain',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for sites in the mozilla.ca domain'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for sites in the mozilla.us domain'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.co.nz domain',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.co.uk domain',
        ),
      ).toBeInTheDocument();
    });

    it('formats site permissions', () => {
      addon.current_version = createVersionWithPermissions({
        required: [
          '*://developer.mozilla.org/*',
          '*://addons.mozilla.org/*',
          '*://www.mozilla.org/*',
        ],
        host: ['*://testing.mozilla.org/*', '*://awesome.mozilla.org/*'],
      });
      renderWithAddon();

      expect(
        screen.getByText('Access your data for developer.mozilla.org'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for addons.mozilla.org'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for www.mozilla.org'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for testing.mozilla.org'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for awesome.mozilla.org'),
      ).toBeInTheDocument();
    });

    it.each(['<all_urls>', '*://*/'])(
      'returns a single host permission for all urls',
      (allUrlsPermission) => {
        const permissions = [
          '*://*.mozilla.com/*',
          '*://developer.mozilla.org/*',
        ];
        addon.current_version = createVersionWithPermissions({
          required: [...permissions, allUrlsPermission],
          host: [...permissions, allUrlsPermission],
        });
        renderWithAddon();

        // The all URLs permission will be displayed in both required and
        // optional permissions.
        expect(
          screen.getAllByText('Access your data for all websites'),
        ).toHaveLength(2);
      },
    );

    it.each(['<all_urls>', '*://*/'])(
      'returns a single optional host permission for all urls',
      (allUrlsPermission) => {
        const permissions = [
          '*://*.mozilla.com/*',
          '*://developer.mozilla.org/*',
        ];
        addon.current_version = createVersionWithPermissions({
          host: [...permissions, allUrlsPermission],
        });
        renderWithAddon();

        expect(
          screen.getByText('Access your data for all websites'),
        ).toBeInTheDocument();
      },
    );

    it('does not return a host permission for moz-extension: urls', () => {
      addon.current_version = createVersionWithPermissions({
        required: ['moz-extension://should/not/generate/a/permission/'],
        host: ['moz-extension://should/not/generate/another/permission/'],
      });
      renderWithAddon();

      expect(screen.queryByClassName('Permission')).not.toBeInTheDocument();
    });

    it('does not return a host permission for an invalid pattern', () => {
      addon.current_version = createVersionWithPermissions({
        required: ['*'],
        host: ['*'],
      });
      renderWithAddon();

      expect(screen.queryByClassName('Permission')).not.toBeInTheDocument();
    });

    it('deduplicates domain and site permissions', () => {
      addon.current_version = createVersionWithPermissions({
        required: [
          'https://*.okta.com/',
          'https://*.okta.com/signin/verify/okta/push',
          'https://*.okta.com/signin/verify/okta/sms',
          'https://trishulgoel.com/about',
          'https://trishulgoel.com/speaker',
          '*://*.mozilla.org/*',
          '*://*.mozilla.com/*',
          '*://*.mozilla.ca/*',
          '*://*.mozilla.us/*',
          '*://*.mozilla.co.nz/*',
          '*://*.mozilla.co.uk/*',
        ],
        host: ['https://*.okta.com/login/login.htm*'],
      });
      renderWithAddon();

      // This will be displayed in both required and optional permissions.
      expect(
        screen.getAllByText(
          'Access your data for sites in the okta.com domain',
        ),
      ).toHaveLength(2);
      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.org domain',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.com domain',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for sites in the mozilla.ca domain'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for sites in the mozilla.us domain'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.co.nz domain',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Access your data for sites in the mozilla.co.uk domain',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Access your data for trishulgoel.com'),
      ).toBeInTheDocument();
    });
  });

  describe('Tests for AddonRecommendations', () => {
    const thisErrorHandlerId = 'AddonRecommendations';

    function doFetchRecommendations(guid = addon.guid) {
      store.dispatch(
        fetchRecommendations({
          errorHandlerId: thisErrorHandlerId,
          guid,
        }),
      );
    }

    function doLoadRecommendations(props = {}) {
      store.dispatch(
        loadRecommendations({
          guid: addon.guid,
          ...fakeRecommendations,
          ...props,
        }),
      );
    }

    it('renders nothing without an addon', () => {
      render();

      expect(
        screen.queryByText('Other users with this extension also installed'),
      ).not.toBeInTheDocument();
    });

    it('renders nothing if there is an error', () => {
      createFailedErrorHandler({ id: thisErrorHandlerId, store });
      doLoadRecommendations({
        addons: [fakeAddon],
        outcome: OUTCOME_RECOMMENDED,
      });
      renderWithAddon();

      expect(
        screen.queryByText('Other users with this extension also installed'),
      ).not.toBeInTheDocument();
    });

    it('renders an AddonCard when recommendations are loaded', () => {
      const name = 'Some add-on name';
      const slug = 'some-add-on-slug';
      const summary = 'Some add-on summary';
      const apiAddons = [
        {
          ...fakeAddon,
          authors: [{ ...fakeAuthor, name: authorName }],
          name: createLocalizedString(name),
          slug,
          summary,
        },
      ];
      const outcome = OUTCOME_RECOMMENDED;
      doLoadRecommendations({
        addons: apiAddons,
        outcome,
      });
      renderWithAddon();

      const expectedLink = [
        `/${lang}/${clientApp}/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
        'utm_medium=referral',
        `utm_content=${outcome}`,
      ].join('&');

      // This shows that the add-on was passed to AddonsCard, along
      // with a correct addonInstallSource.
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        expectedLink,
      );
      // This shows that the header was passed.
      expect(
        screen.getByText('Other users with this extension also installed'),
      ).toBeInTheDocument();
      // This shows that showMetadata is true.
      expect(
        screen.getByRole('heading', { name: authorName }),
      ).toBeInTheDocument();
      // This shows that showSummary is false.
      expect(screen.queryByText(summary)).not.toBeInTheDocument();
    });

    it('renders an AddonCard when recommendations are loading', () => {
      doFetchRecommendations();
      renderWithAddon();

      expect(
        within(
          within(screen.getByClassName('AddonRecommendations')).getByClassName(
            'Card-header',
          ),
        ).getByRole('alert'),
      ).toBeInTheDocument();
      expect(
        within(screen.getByClassName('AddonRecommendations')).getAllByAltText(
          '',
        ),
      ).toHaveLength(4);
    });

    it('renders the expected header and source for the curated outcome', () => {
      const name = 'Some add-on name';
      const slug = 'some-add-on-slug';
      const apiAddons = [
        {
          ...fakeAddon,
          name: createLocalizedString(name),
          slug,
        },
      ];
      const outcome = OUTCOME_CURATED;
      doLoadRecommendations({
        addons: apiAddons,
        outcome,
      });
      renderWithAddon();

      const expectedLink = [
        `/${lang}/${clientApp}/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
        'utm_medium=referral',
        `utm_content=${outcome}`,
      ].join('&');
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        expectedLink,
      );
      expect(screen.getByText('Other popular extensions')).toBeInTheDocument();
    });

    it('renders the expected header and source for the recommended_fallback outcome', () => {
      const name = 'Some add-on name';
      const slug = 'some-add-on-slug';
      const apiAddons = [
        {
          ...fakeAddon,
          name: createLocalizedString(name),
          slug,
        },
      ];
      const outcome = OUTCOME_RECOMMENDED_FALLBACK;
      doLoadRecommendations({
        addons: apiAddons,
        outcome,
      });
      renderWithAddon();

      const expectedLink = [
        `/${lang}/${clientApp}/addon/${slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
        'utm_medium=referral',
        `utm_content=${outcome}`,
      ].join('&');
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        expectedLink,
      );
      expect(screen.getByText('Other popular extensions')).toBeInTheDocument();
    });

    it.each([ADDON_TYPE_DICT, ADDON_TYPE_LANG, ADDON_TYPE_STATIC_THEME])(
      'does not render recommendations if the add-on is a %s',
      (addonType) => {
        addon.type = addonType;
        doLoadRecommendations({
          addons: [fakeAddon],
          outcome: OUTCOME_RECOMMENDED_FALLBACK,
        });
        renderWithAddon();

        expect(
          screen.queryByText('Other popular extensions'),
        ).not.toBeInTheDocument();
      },
    );

    it('does not render recommendations for Android', () => {
      doLoadRecommendations({
        addons: [fakeAddon],
        outcome: OUTCOME_RECOMMENDED_FALLBACK,
      });
      store.dispatch(setClientApp(CLIENT_APP_ANDROID));
      renderWithAddon();

      expect(
        screen.queryByText('Other popular extensions'),
      ).not.toBeInTheDocument();
    });

    it('should dispatch a fetch action if no recommendations exist', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).toHaveBeenCalledWith(
        fetchRecommendations({
          errorHandlerId: thisErrorHandlerId,
          guid: addon.guid,
        }),
      );
    });

    it('should not dispatch a fetch action if addon is null', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_RECOMMENDATIONS }),
      );
    });

    it('should dispatch a fetch action if the addon is updated', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const newGuid = `${addon.guid}-new`;
      const newSlug = `${defaultSlug}-new`;
      renderWithAddon();

      dispatch.mockClear();

      store.dispatch(
        loadAddon({
          addon: { ...fakeAddon, guid: newGuid, slug: newSlug },
          slug: newSlug,
        }),
      );
      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        fetchRecommendations({
          errorHandlerId: thisErrorHandlerId,
          guid: newGuid,
        }),
      );
    });

    it('should not dispatch a fetch if the addon is updated but not changed', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      dispatch.mockClear();

      await changeLocation({
        history,
        pathname: getLocation(),
      });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_RECOMMENDATIONS }),
      );
    });

    it('should not dispatch a fetch if the addon is updated to null', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const newSlug = `${defaultSlug}-new`;
      renderWithAddon();

      dispatch.mockClear();

      // Switch to a different add-on, that has not been loaded.
      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_RECOMMENDATIONS }),
      );
    });

    it('should send a GA ping when recommendations are loaded', async () => {
      const fallbackReason = 'timeout';
      const outcome = OUTCOME_RECOMMENDED_FALLBACK;
      renderWithAddon();

      tracking.sendEvent.mockClear();

      doLoadRecommendations({
        outcome,
        fallbackReason,
      });

      await waitFor(() => {
        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
      });
      expect(tracking.sendEvent).toHaveBeenCalledWith({
        action: `${outcome}-${fallbackReason}`,
        category: TAAR_IMPRESSION_CATEGORY,
        label: addon.guid,
      });
    });

    it('should send a GA ping without a fallback', async () => {
      const fallbackReason = null;
      const outcome = OUTCOME_RECOMMENDED;
      renderWithAddon();

      tracking.sendEvent.mockClear();

      doLoadRecommendations({
        outcome,
        fallbackReason,
      });

      await waitFor(() => {
        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
      });
      expect(tracking.sendEvent).toHaveBeenCalledWith({
        action: outcome,
        category: TAAR_IMPRESSION_CATEGORY,
        label: addon.guid,
      });
    });

    it('should not send a GA ping when recommendations are loading', () => {
      doFetchRecommendations();
      renderWithAddon();

      expect(tracking.sendEvent).not.toHaveBeenCalled();
    });

    it('should not send a GA ping when there an error', () => {
      createFailedErrorHandler({ id: thisErrorHandlerId, store });
      renderWithAddon();

      expect(tracking.sendEvent).not.toHaveBeenCalled();
    });
  });

  describe('more add-ons by authors', () => {
    it('puts "add-ons by author" in main content if type is theme', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_STATIC_THEME,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      // Verifying that Addon passes a className to AddonsByAuthorsCard.
      expect(screen.getByClassName('AddonsByAuthorsCard')).toHaveClass(
        'Addon-MoreAddonsCard',
      );

      expect(screen.getAllByClassName('AddonsByAuthorsCard')).toHaveLength(1);
      expect(
        within(screen.getByClassName('Addon-main-content')).getByText(
          `More themes by ${authorName}`,
        ),
      ).toBeInTheDocument();
    });

    it('puts "add-ons by author" outside main if type is not theme', () => {
      addon.type = ADDON_TYPE_EXTENSION;
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      expect(screen.getAllByClassName('AddonsByAuthorsCard')).toHaveLength(1);
      expect(
        // eslint-disable-next-line testing-library/prefer-presence-queries
        within(screen.getByClassName('Addon-main-content')).queryByText(
          `More themes by ${authorName}`,
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(`More extensions by ${authorName}`),
      ).toBeInTheDocument();
    });

    it('is hidden when an add-on has not loaded yet', () => {
      render();

      expect(
        screen.queryByClassName('AddonsByAuthorsCard'),
      ).not.toBeInTheDocument();
    });

    it('is hidden when add-on has no authors', () => {
      addon.authors = [];
      renderWithAddon();

      expect(
        screen.queryByClassName('AddonsByAuthorsCard'),
      ).not.toBeInTheDocument();
    });

    it('displays more add-ons by authors for an extension', async () => {
      const moreAddonName = 'Name of more add-on';
      renderWithAddon();

      loadAddonsByAuthors({
        addonName: moreAddonName,
        addonType: ADDON_TYPE_EXTENSION,
        count: 2,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonsByAuthorsCard = screen.getByClassName('AddonsByAuthorsCard');
      expect(
        await within(addonsByAuthorsCard).findByText(
          `More extensions by ${authorName}`,
        ),
      ).toBeInTheDocument();
      expect(
        within(addonsByAuthorsCard).getByRole('link', {
          name: `${moreAddonName}-0`,
        }),
      ).toBeInTheDocument();
      expect(
        within(addonsByAuthorsCard).getByRole('link', {
          name: `${moreAddonName}-1`,
        }),
      ).toBeInTheDocument();
      // Checking that it passes showSummary: false to AddonsCard.
      expect(
        within(addonsByAuthorsCard).queryByClassName('SearchResult-summary'),
      ).not.toBeInTheDocument();
      expect(addonsByAuthorsCard).toHaveClass('AddonsCard--horizontal');
    });

    it('displays more add-ons by authors for a theme', async () => {
      const moreAddonName = 'Name of more add-on';
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      loadAddonsByAuthors({
        addonName: moreAddonName,
        addonType: ADDON_TYPE_STATIC_THEME,
        count: 2,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonsByAuthorsCard = screen.getByClassName('AddonsByAuthorsCard');
      expect(
        await within(addonsByAuthorsCard).findByText(
          `More themes by ${authorName}`,
        ),
      ).toBeInTheDocument();
      expect(
        within(addonsByAuthorsCard).getByRole('link', {
          name: `${moreAddonName}-0`,
        }),
      ).toBeInTheDocument();
      expect(
        within(addonsByAuthorsCard).getByRole('link', {
          name: `${moreAddonName}-1`,
        }),
      ).toBeInTheDocument();
    });

    it('adds a CSS class to the main component when there are add-ons', async () => {
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonComponent = screen.getByClassName('Addon');

      await waitFor(() =>
        expect(addonComponent).toHaveClass('Addon--has-more-than-0-addons'),
      );
      expect(addonComponent).not.toHaveClass('Addon--has-more-than-3-addons');
    });

    it('adds a CSS class when there are more than 3 other add-ons', async () => {
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 4,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonComponent = screen.getByClassName('Addon');

      await waitFor(() =>
        expect(addonComponent).toHaveClass('Addon--has-more-than-0-addons'),
      );
      expect(addonComponent).toHaveClass('Addon--has-more-than-3-addons');
    });
  });

  describe('Tests for AddonsByAuthorsCard', () => {
    const getThisErrorHandlerId = (type) => `AddonsByAuthorsCard-${type}`;

    it('should render nothing if there are no add-ons', async () => {
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 0,
        forAddonSlug: defaultSlug,
        store,
      });

      await waitFor(() =>
        expect(
          screen.queryByClassName('AddonsByAuthorsCard'),
        ).not.toBeInTheDocument(),
      );
    });

    it('should render a loading state on first instantiation', () => {
      renderWithAddon();

      // Expect 6 placeholders with 4 LoadingText each.
      expect(
        within(screen.getByClassName('AddonsByAuthorsCard')).getAllByRole(
          'alert',
        ),
      ).toHaveLength(24);
    });

    it('should render a card with loading state if loading', () => {
      store.dispatch(
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorIds: [authorUserId],
          errorHandlerId: getThisErrorHandlerId(ADDON_TYPE_EXTENSION),
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );
      renderWithAddon();

      expect(
        within(screen.getByClassName('AddonsByAuthorsCard')).getAllByRole(
          'alert',
        ),
      ).toHaveLength(24);
    });

    // We want to always make sure to do a fetch to make sure
    // we have the latest addons list.
    // See: https://github.com/mozilla/addons-frontend/issues/4852
    it('should always fetch addons by authors', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorIds: [authorUserId],
          errorHandlerId: getThisErrorHandlerId(ADDON_TYPE_EXTENSION),
          forAddonSlug: defaultSlug,
          pageSize: '6',
        }),
      );
    });

    it('should dispatch a fetch action if authorIds are updated', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      dispatch.mockClear();

      // Render the page for a different add-on with a different author.
      const newAuthorId = authorUserId + 1;
      const newSlug = `${defaultSlug}-new`;
      addon.authors = [{ ...addon.author, id: newAuthorId }];
      addon.slug = newSlug;
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();

      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_STATIC_THEME,
          authorIds: [newAuthorId],
          errorHandlerId: getThisErrorHandlerId(ADDON_TYPE_STATIC_THEME),
          forAddonSlug: newSlug,
          pageSize: '6',
        }),
      );

      // Make sure an authorIds update even with the same addonType
      // dispatches a fetch action.
      const anotherAuthorId = newAuthorId + 1;
      const anotherSlug = `${newSlug}-new`;
      addon.authors = [{ ...addon.author, id: anotherAuthorId }];
      addon.slug = anotherSlug;
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();

      await changeLocation({
        history,
        pathname: getLocation({ slug: anotherSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_STATIC_THEME,
          authorIds: [anotherAuthorId],
          errorHandlerId: getThisErrorHandlerId(ADDON_TYPE_STATIC_THEME),
          forAddonSlug: anotherSlug,
          pageSize: '6',
        }),
      );
    });

    it('should dispatch a fetch action if addonType is updated', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      dispatch.mockClear();

      // Render the page for a different add-on with a different type.
      const newSlug = `${defaultSlug}-new`;
      addon.slug = newSlug;
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();

      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_STATIC_THEME,
          authorIds: [authorUserId],
          errorHandlerId: getThisErrorHandlerId(ADDON_TYPE_STATIC_THEME),
          forAddonSlug: newSlug,
          pageSize: '6',
        }),
      );
    });

    it('should not dispatch a fetch action if props are not changed', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      dispatch.mockClear();

      // Render the page for the same add-on, with an unrelated prop change..
      addon.name = createLocalizedString('Some other name');
      _loadAddon();

      await changeLocation({
        history,
        pathname: getLocation({ slug: defaultSlug }),
      });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_ADDONS_BY_AUTHORS }),
      );
    });

    it.each([ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME])(
      'should display at most numberOfAddons for %s',
      (type) => {
        addon.type = type;
        renderWithAddon();

        loadAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          count: 10,
          forAddonSlug: defaultSlug,
          store,
        });

        expect(
          within(screen.getByClassName('AddonsByAuthorsCard')).getAllByRole(
            'listitem',
          ),
        ).toHaveLength(ADDONS_BY_AUTHORS_COUNT);
      },
    );

    it('should add a theme class if it is a static theme', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_STATIC_THEME,
        count: 10,
        forAddonSlug: defaultSlug,
        store,
      });

      expect(screen.getByClassName('AddonsByAuthorsCard')).toHaveClass(
        'AddonsByAuthorsCard--theme',
      );
    });

    it.each([
      [ADDON_TYPE_DICT, `More dictionaries by ${authorName}`],
      [ADDON_TYPE_EXTENSION, `More extensions by ${authorName}`],
      [ADDON_TYPE_LANG, `More language packs by ${authorName}`],
      [ADDON_TYPE_STATIC_THEME, `More themes by ${authorName}`],
      ['unknown-type', `More add-ons by ${authorName}`],
    ])('shows expected header for %s', (type, header) => {
      addon.type = type;
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: type,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      expect(screen.getByText(header)).toBeInTheDocument();
    });

    it.each([
      [ADDON_TYPE_DICT, 'More dictionaries by these translators'],
      [ADDON_TYPE_EXTENSION, 'More extensions by these developers'],
      [ADDON_TYPE_LANG, 'More language packs by these translators'],
      [ADDON_TYPE_STATIC_THEME, 'More themes by these artists'],
      ['unknown-type', 'More add-ons by these developers'],
    ])('shows expected header for %s with multiple authors', (type, header) => {
      addon.type = type;
      addon.authors = fakeAuthors;
      renderWithAddon();

      loadAddonsByAuthors({
        addonType: type,
        count: 1,
        forAddonSlug: defaultSlug,
        multipleAuthors: true,
        store,
      });

      expect(screen.getByText(header)).toBeInTheDocument();
    });

    it('renders an error when an API error is thrown', () => {
      const message = 'Some error message';
      createFailedErrorHandler({
        id: getThisErrorHandlerId(ADDON_TYPE_EXTENSION),
        message,
        store,
      });
      renderWithAddon();

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Tests for PromotedBadge', () => {
    const renderWithPromotedCategory = (category = RECOMMENDED) => {
      addon.promoted = { category, apps: [clientApp] };
      renderWithAddon();
    };

    it('can be rendered as large', () => {
      renderWithPromotedCategory();

      const badge = screen.getByTestId(`badge-${RECOMMENDED}`);
      expect(badge).toBeInTheDocument();

      const icon = within(badge).getByClassName('Badge-icon');
      expect(icon).toHaveClass('Badge-icon--large');
    });

    it.each([
      [
        'line',
        'Official add-on built by Mozilla Firefox. Meets security and performance standards.',
        'By Firefox',
      ],
      [
        'recommended',
        'Firefox only recommends add-ons that meet our standards for security and performance.',
        'Recommended',
      ],
    ])(
      'renders the category "%s" as expected',
      (category, linkTitle, label) => {
        renderWithPromotedCategory(category);

        const badge = screen.getByTestId(`badge-${category}`);

        expect(badge).toBeInTheDocument();

        const link = within(badge).getByTitle(linkTitle);
        expect(link).toHaveAttribute(
          'href',
          getPromotedBadgesLinkUrl({
            utm_content: 'promoted-addon-badge',
          }),
        );
        expect(link).toHaveClass(`Badge-link`);

        const content = within(badge).getByClassName('Badge-content');
        expect(content).toHaveTextContent(label);
      },
    );

    it('does not render the strategic or spotlight badges and correctly renders only the most important badge (RECOMMENDED)', () => {
      const categories = [LINE, RECOMMENDED, STRATEGIC, SPOTLIGHT];
      addon.promoted = categories.map((category) => ({
        category,
        apps: [clientApp],
      }));
      renderWithAddon();
      const badges = screen.getAllByClassName('Badge');
      expect(badges).toHaveLength(2);
      expect(badges[0]).toHaveTextContent('Recommended');
    });

    // See https://github.com/mozilla/addons-frontend/issues/8285.
    it('does not pass an alt property to BadgeIcon', () => {
      renderWithPromotedCategory();

      const badge = screen.getByTestId(`badge-${RECOMMENDED}`);
      const icon = within(badge).getByClassName('Badge-icon');
      expect(icon).not.toHaveAttribute('alt');
    });
  });

  describe('Tests for AddonBadges', () => {
    it('returns null when there is no add-on', () => {
      render();

      expect(screen.queryByClassName('AddonBadges')).not.toBeInTheDocument();
    });

    it('displays no badges when none are called for', () => {
      addon = {
        ...addon,
        current_version: {
          ...addon.current_version,
          compatibility: {
            firefox: addon.current_version.compatibility.firefox,
          },
        },
      };
      renderWithAddon();

      expect(
        // eslint-disable-next-line testing-library/prefer-presence-queries
        within(screen.getByClassName('AddonBadges')).queryByTagName('div'),
      ).not.toBeInTheDocument();
    });

    it('displays a badge when the addon is experimental', () => {
      addon.is_experimental = true;
      renderWithAddon();

      const badge = screen.getByTestId(`badge-experimental-badge`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Experimental');
    });

    it('displays a badge when the addon requires payment', () => {
      addon.requires_payment = true;
      renderWithAddon();

      const badge = screen.getByTestId(`badge-requires-payment`);
      expect(badge).toHaveTextContent('Some features may require payment');
    });

    it('displays a badge when the add-on is compatible with Android on Desktop', () => {
      renderWithAddon();

      const badge = screen.getByTestId(`badge-android`);
      expect(badge).toBeInTheDocument();

      // The footer should also be updated when we show this badge.
      expect(
        screen.getByText(/Android is a trademark of Google LLC/),
      ).toBeInTheDocument();
    });

    it('does not display a badge when the add-on is compatible with a max version other than "*"', () => {
      addon = {
        ...addon,
        current_version: {
          ...addon.current_version,
          compatibility: {
            ...addon.current_version.compatibility,
            [CLIENT_APP_ANDROID]: {
              ...addon.current_version.compatibility[CLIENT_APP_ANDROID],
              max: '68.*',
            },
          },
        },
      };
      renderWithAddon();

      expect(screen.queryByClassName('Badge-android')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Android is a trademark of Google LLC/),
      ).not.toBeInTheDocument();
    });

    it('does not display a badge when the add-on is compatible with Android but it is not an extension', () => {
      // That cannot possibly work at the moment, i.e. only extensions are
      // compatible with Firefox for Android.
      addon = { ...addon, type: ADDON_TYPE_STATIC_THEME };
      renderWithAddon();

      expect(screen.queryByClassName('Badge-android')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Android is a trademark of Google LLC/),
      ).not.toBeInTheDocument();
    });

    it('does not display a badge when the add-on is compatible with Android on Android', () => {
      store.dispatch(setClientApp(CLIENT_APP_ANDROID));
      renderWithAddon();

      expect(screen.queryByClassName('Badge-android')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Android is a trademark of Google LLC/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for installAddon', () => {
    it('sets status when getting updated', async () => {
      const newGuid = `${addon.guid}-new`;
      const newSlug = `${defaultSlug}-new`;
      renderWithAddon();

      expect(getAddon).toHaveBeenCalledWith(addon.guid);

      store.dispatch(
        loadAddon({
          addon: { ...fakeAddon, guid: newGuid, slug: newSlug },
          slug: newSlug,
        }),
      );
      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(getAddon).toHaveBeenCalledWith(newGuid);
    });

    it('sets status when add-on is loaded on update', async () => {
      const newGuid = `${addon.guid}-new`;
      const newSlug = `${defaultSlug}-new`;

      render();

      expect(getAddon).not.toHaveBeenCalled();

      store.dispatch(
        loadAddon({
          addon: { ...fakeAddon, guid: newGuid, slug: newSlug },
          slug: newSlug,
        }),
      );
      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(getAddon).toHaveBeenCalledWith(newGuid);
    });

    it('does not set status when an update is not necessary', async () => {
      renderWithAddon();

      expect(getAddon).toHaveBeenCalledWith(addon.guid);
      getAddon.mockClear();

      // Update the component with the same props (i.e. same add-on guid) and
      // make sure the status is not set.
      await changeLocation({
        history,
        pathname: getLocation(),
      });

      expect(getAddon).not.toHaveBeenCalled();
    });
  });
});
