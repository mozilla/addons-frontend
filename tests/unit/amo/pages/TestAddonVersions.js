import { waitFor } from '@testing-library/react';
import UAParser from 'ua-parser-js';

import {
  FETCH_VERSIONS,
  loadVersions,
  fetchVersions,
} from 'amo/reducers/versions';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  FATAL_ERROR,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  INSTALLING,
  STRATEGIC,
  VERIFIED,
} from 'amo/constants';
import { extractId } from 'amo/pages/AddonVersions';
import { formatFilesize } from 'amo/i18n/utils';
import { FETCH_ADDON, fetchAddon, loadAddon } from 'amo/reducers/addons';
import { setInstallError, setInstallState } from 'amo/reducers/installations';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import {
  correctedLocationForPlatform,
  getClientCompatibility,
} from 'amo/utils/compatibility';
import {
  changeLocation,
  createFailedErrorHandler,
  createFakeClientCompatibility,
  createFakeErrorHandler,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  fakeFile,
  fakeI18n,
  fakeVersion,
  getElement,
  renderPage as defaultRender,
  screen,
  userAgents,
  userAgentsByPlatform,
  within,
} from 'tests/unit/helpers';

jest.mock('amo/utils/compatibility', () => ({
  ...jest.requireActual('amo/utils/compatibility'),
  correctedLocationForPlatform: jest.fn().mockReturnValue(''),
  getClientCompatibility: jest.fn().mockReturnValue({
    compatible: true,
    reason: null,
  }),
}));

describe(__filename, () => {
  let history;
  let store;
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultSlug = 'some-add-on-slug';
  const lang = 'en-US';

  const getLocation = (slug = defaultSlug) =>
    `/${lang}/${clientApp}/addon/${slug}/versions/`;

  const getErrorHandlerId = ({ page = '', slug = defaultSlug } = {}) =>
    `src/amo/pages/AddonVersions/index.js-${slug}-${page}`;
  const getFakeErrorHandler = ({ page = '', slug = defaultSlug } = {}) =>
    createFakeErrorHandler({ id: getErrorHandlerId({ page, slug }) });

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = ({ location, slug = defaultSlug } = {}) => {
    const initialEntry = location || getLocation(slug);
    const renderOptions = { initialEntries: [initialEntry], store };

    const renderResults = defaultRender(renderOptions);
    history = renderResults.history;
    return renderResults;
  };

  const _loadAddon = (addon = { ...fakeAddon, slug: defaultSlug }) => {
    store.dispatch(loadAddon({ addon, slug: addon.slug }));
  };

  const _loadVersions = ({
    slug = defaultSlug,
    versions = [fakeVersion],
  } = {}) => {
    store.dispatch(loadVersions({ slug, versions }));
  };

  const renderWithAddonAndVersions = ({
    addon = { ...fakeAddon, slug: defaultSlug },
    versions = [fakeVersion],
    ...props
  } = {}) => {
    _loadAddon(addon);
    _loadVersions({ versions });
    return render({ ...props });
  };

  const allVersionCards = () => screen.getAllByClassName('AddonVersionCard');

  it('does not fetch anything if there is an error', () => {
    createFailedErrorHandler({ id: getErrorHandlerId(), store });
    const dispatch = jest.spyOn(store, 'dispatch');

    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('fetches an addon when requested by slug', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchAddon({
        errorHandler: getFakeErrorHandler(),
        showGroupedRatings: true,
        slug: defaultSlug,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
  });

  it('does not fetch an addon if one is already loaded', () => {
    _loadAddon();
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
  });

  it('does not fetch an addon if one is already loading', () => {
    store.dispatch(
      fetchAddon({ errorHandler: getFakeErrorHandler(), slug: defaultSlug }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
  });

  it('fetches an addon when the slug changes', async () => {
    const slug = 'some-slug';
    const newSlug = 'some-other-slug';
    const addon = { ...fakeAddon, slug };

    _loadAddon(addon);

    const dispatch = jest.spyOn(store, 'dispatch');
    render({ location: getLocation(slug) });

    await changeLocation({
      history,
      pathname: getLocation(newSlug),
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchAddon({
        errorHandler: getFakeErrorHandler({ slug: newSlug }),
        showGroupedRatings: true,
        slug: newSlug,
      }),
    );
  });

  it('fetches versions when versions are not loaded', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchVersions({
        errorHandlerId: getErrorHandlerId(),
        slug: defaultSlug,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('does not fetch versions if they are already loading', () => {
    _loadAddon();
    store.dispatch(
      fetchVersions({ errorHandlerId: getErrorHandlerId(), slug: defaultSlug }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('does not fetch versions if they are already loaded', () => {
    _loadAddon();
    _loadVersions();
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('fetches versions when the slug changes', async () => {
    const slug = 'some-slug';
    const newSlug = 'some-other-slug';
    const addon = { ...fakeAddon, slug };

    _loadAddon(addon);

    const dispatch = jest.spyOn(store, 'dispatch');
    render({ location: getLocation(slug) });

    await changeLocation({
      history,
      pathname: getLocation(newSlug),
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchVersions({
        errorHandlerId: getErrorHandlerId({ slug: newSlug }),
        slug: newSlug,
      }),
    );
  });

  it('generates an empty header when no add-on is loaded', async () => {
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        'Add-ons for Firefox (en-US)',
      ),
    );

    expect(
      screen.getByClassName('AddonSummaryCard-header-text'),
    ).toHaveTextContent('');
  });

  it('generates an empty header when no versions have loaded', async () => {
    _loadAddon();
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        'Add-ons for Firefox (en-US)',
      ),
    );

    expect(
      within(
        screen.getByClassName('AddonSummaryCard-header-text'),
      ).getByClassName('visually-hidden'),
    ).toHaveTextContent('');
  });

  it('generates a header with add-on name and version count when versions have loaded', async () => {
    const name = 'My addon';
    const addon = {
      ...fakeAddon,
      name: createLocalizedString(name),
      slug: defaultSlug,
    };
    const versions = [fakeVersion];
    const expectedHeader = `${name} version history - ${versions.length} version`;

    _loadAddon(addon);
    _loadVersions({ versions });

    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(expectedHeader),
    );
    expect(
      screen.getByRole('heading', { name: expectedHeader }),
    ).toBeInTheDocument();
  });

  it('generates a header for multiple versions', async () => {
    const name = 'My addon';
    const addon = {
      ...fakeAddon,
      name: createLocalizedString(name),
      slug: defaultSlug,
    };
    const versions = [fakeVersion, fakeVersion];
    const expectedHeader = `${name} version history - ${versions.length} versions`;

    _loadAddon(addon);
    _loadVersions({ versions });

    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(expectedHeader),
    );
  });

  it('passes an add-on to the AddonSummaryCard', () => {
    _loadAddon();
    render();

    expect(screen.getByAltText('Add-on icon')).toHaveAttribute(
      'src',
      fakeAddon.icon_url,
    );
  });

  it('passes a LoadingText component to the CardList header if the header is blank', () => {
    render();

    expect(
      within(
        within(screen.getByClassName('CardList')).getByClassName(
          'Card-header-text',
        ),
      ).getByRole('alert'),
    ).toBeInTheDocument();
  });

  it('passes the errorHandler and isAddonInstallPage to the Page component', () => {
    dispatchClientMetadata({ store, userAgent: userAgents.chrome[0] });
    const message = 'Some error message';
    createFailedErrorHandler({
      id: getErrorHandlerId(),
      message,
      store,
    });

    render();

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText('download Firefox')).not.toBeInTheDocument();
  });

  // This also tests a lot of the functionality in AddonVersionCard
  it('passes the first found version into the AddonVersionCard', () => {
    const app = 'testApp';
    const created = '1967-02-19T10:09:01Z';
    const i18n = fakeI18n();
    const licenseName = 'some license name';
    const licenseURL = 'http://example.com/';
    const max = '2.0';
    const min = '1.0';
    const releaseNotes = 'Some release notes';
    const size = 12345;
    const versionNumber = '1.0';
    const version1 = {
      ...fakeVersion,
      compatibility: {
        [app]: {
          min,
          max,
        },
      },
      file: { ...fakeFile, created, size },
      id: 1,
      license: {
        ...fakeVersion.license,
        name: createLocalizedString(licenseName),
        url: licenseURL,
      },
      release_notes: createLocalizedString(releaseNotes),
      version: versionNumber,
    };
    const addon = {
      ...fakeAddon,
      slug: defaultSlug,
      current_version: version1,
    };
    const version2 = { ...fakeVersion, id: 2 };

    _loadAddon(addon);
    _loadVersions({ versions: [version1, version2] });

    render();

    const latestVersionCard = allVersionCards()[0];
    expect(
      within(latestVersionCard).getByRole('heading', {
        name: `Version ${versionNumber}`,
      }),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByText(`Works with ${app} ${min} to ${max}`),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByText(
        `Released ${i18n.moment(created).format('ll')} - ${formatFilesize({
          i18n,
          size,
        })}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByText(releaseNotes),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByTextAcrossTags(
        `Source code released under ${licenseName}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByRole('link', { name: licenseName }),
    ).toHaveAttribute('href', licenseURL);
  });

  it('does not render file info when created date is missing', () => {
    const version = {
      ...fakeVersion,
      file: { ...fakeFile, created: null },
    };
    const addon = {
      ...fakeAddon,
      slug: defaultSlug,
      current_version: version,
    };
    renderWithAddonAndVersions({ addon, versions: [version] });

    expect(
      screen.queryByClassName('AddonVersionCard-fileInfo'),
    ).not.toBeInTheDocument();
  });

  it('passes the correct versions into multiple AddonVersionCards', () => {
    const version1 = { ...fakeVersion, id: 1, version: '1.0' };
    const addon = {
      ...fakeAddon,
      slug: defaultSlug,
      current_version: version1,
    };
    const version2 = { ...fakeVersion, id: 2, version: '2.0' };
    const version3 = { ...fakeVersion, id: 3, version: '3.0' };

    _loadAddon(addon);
    _loadVersions({ versions: [version1, version2, version3] });

    render();

    const versionCards = allVersionCards();
    expect(versionCards).toHaveLength(3);
    expect(
      within(versionCards[0]).getByText('Version 1.0'),
    ).toBeInTheDocument();
    expect(
      within(versionCards[1]).getByText('Version 2.0'),
    ).toBeInTheDocument();
    expect(
      within(versionCards[2]).getByText('Version 3.0'),
    ).toBeInTheDocument();
  });

  it('displays expected headings for latest and older versions', () => {
    const version1 = { ...fakeVersion, id: 1 };
    const addon = {
      ...fakeAddon,
      slug: defaultSlug,
      current_version: version1,
    };
    const version2 = { ...fakeVersion, id: 2 };
    const version3 = { ...fakeVersion, id: 3 };
    const version4 = { ...fakeVersion, id: 4 };

    _loadAddon(addon);
    _loadVersions({ versions: [version1, version2, version3, version4] });

    render();

    const versionCards = allVersionCards();

    expect(
      within(versionCards[0]).getByRole('heading', {
        name: 'Latest version',
      }),
    ).toBeInTheDocument();
    expect(
      within(versionCards[1]).getByRole('heading', {
        name: 'Older versions',
      }),
    ).toBeInTheDocument();
    expect(
      within(versionCards[1]).queryByRole('heading', {
        name: 'Latest version',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[2]).queryByRole('heading', {
        name: 'Older versions',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[2]).queryByRole('heading', {
        name: 'Latest version',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[3]).queryByRole('heading', {
        name: 'Older versions',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[3]).queryByRole('heading', {
        name: 'Latest version',
      }),
    ).not.toBeInTheDocument();
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the slug prop and page query param', () => {
      const page = 19;
      const slug = 'some-addon-slug';
      expect(
        extractId({
          location: { query: { page } },
          match: { params: { slug } },
        }),
      ).toEqual(`${slug}-${page}`);
    });

    it('returns a unique ID provided by just the slug if there is no page query param', () => {
      const slug = 'some-addon-slug';
      expect(
        extractId({
          location: { query: {} },
          match: { params: { slug } },
        }),
      ).toEqual(`${slug}-`);
    });
  });

  describe('Tests for AddonVersionCard', () => {
    it('returns a card with a message if version is null', () => {
      _loadAddon();
      _loadVersions({ versions: [] });
      render();

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'No version found',
      );
    });

    it('returns a card with LoadingText if version is undefined', () => {
      _loadAddon();
      render();

      expect(
        within(screen.getByClassName('AddonVersionCard')).getAllByRole('alert'),
      ).toHaveLength(3);
    });

    it('renders nothing for compatibility when no version is loaded', () => {
      _loadAddon();
      render();

      expect(
        screen.queryByClassName('AddonVersionCard-compatibility'),
      ).not.toBeInTheDocument();
    });

    it('strips illegal HTML from release notes', () => {
      const releaseNotesText = 'Some release notes';
      const releaseNotes = `<b>${releaseNotesText}</b>`;
      const badReleaseNotes = `<script>alert()</script>${releaseNotes}`;
      _loadAddon();
      _loadVersions({
        versions: [
          {
            ...fakeVersion,
            release_notes: createLocalizedString(badReleaseNotes),
          },
        ],
      });
      render();

      expect(screen.getByText(releaseNotesText)).toBeInTheDocument();
      expect(
        within(
          screen.getByClassName('AddonVersionCard-releaseNotes'),
        ).getByTagName('b'),
      ).toBeInTheDocument();
      expect(
        within(
          // eslint-disable-next-line testing-library/prefer-presence-queries
          screen.getByClassName('AddonVersionCard-releaseNotes'),
        ).queryByTagName('script'),
      ).not.toBeInTheDocument();
    });

    it('displays a license without a name', () => {
      const licenseName = null;
      _loadAddon();
      _loadVersions({
        versions: [
          {
            ...fakeVersion,
            license: {
              ...fakeVersion.license,
              name: createLocalizedString(licenseName),
            },
          },
        ],
      });
      render();

      expect(screen.getByText('Custom License')).toBeInTheDocument();
    });

    it('renders a link to a custom license', () => {
      const licenseName = 'custom licence';
      _loadAddon();
      _loadVersions({
        versions: [
          {
            ...fakeVersion,
            license: {
              ...fakeVersion.license,
              is_custom: true,
              name: createLocalizedString(licenseName),
            },
          },
        ],
      });
      render();

      expect(screen.getByRole('link', { name: licenseName })).toHaveAttribute(
        'href',
        `/en-US/firefox/addon/${defaultSlug}/license/`,
      );
    });

    it('does not render license info if there is no license', () => {
      _loadAddon();
      _loadVersions({
        versions: [{ ...fakeVersion, license: null }],
      });
      render();

      expect(
        screen.queryByClassName('AddonVersionCard-license'),
      ).not.toBeInTheDocument();
    });

    it('renders plain text when license has no URL', () => {
      const licenseName = 'some license without URL';
      _loadAddon();
      _loadVersions({
        versions: [
          {
            ...fakeVersion,
            license: {
              ...fakeVersion.license,
              name: createLocalizedString(licenseName),
              url: null,
            },
          },
        ],
      });
      render();

      expect(
        screen.getByText(`Source code released under ${licenseName}`),
      ).toBeInTheDocument();
    });

    const setupInstallError = () => {
      const guid = 'some-guid';
      const addon = { ...fakeAddon, guid, slug: defaultSlug };
      store.dispatch(setInstallState({ guid, status: INSTALLING }));
      store.dispatch(setInstallError({ error: FATAL_ERROR, guid }));
      _loadAddon(addon);
    };

    it('passes an install error to AddonInstallError', () => {
      setupInstallError();
      _loadVersions();
      render();

      expect(
        within(screen.getByClassName('AddonInstallError')).getByText(
          'An unexpected error occurred.',
        ),
      ).toBeInTheDocument();
    });

    it('does not render an install error if there is no error', () => {
      renderWithAddonAndVersions();
      render();

      expect(
        screen.queryByClassName('AddonInstallError'),
      ).not.toBeInTheDocument();
    });

    it('does not render an AddonInstallError if there is no version', () => {
      setupInstallError();
      _loadVersions({ versions: [] });
      render();

      expect(
        screen.queryByClassName('AddonInstallError'),
      ).not.toBeInTheDocument();
    });

    it('does not render an AddonInstallError if it is not the current version', () => {
      setupInstallError();
      _loadVersions({
        versions: [fakeVersion, { ...fakeVersion, id: 2 }],
      });
      render();

      const versionCards = allVersionCards();
      expect(
        within(versionCards[0]).getByText('An unexpected error occurred.'),
      ).toBeInTheDocument();
      expect(
        within(versionCards[1]).queryByText('An unexpected error occurred.'),
      ).not.toBeInTheDocument();
    });

    it('does not render an AddonCompatibilityError if there is no version', () => {
      getClientCompatibility.mockReturnValue(
        createFakeClientCompatibility({
          compatible: false,
          reason: INCOMPATIBLE_OVER_MAX_VERSION,
        }),
      );
      renderWithAddonAndVersions({ versions: [] });

      expect(
        screen.queryByClassName('AddonCompatibilityError'),
      ).not.toBeInTheDocument();
    });

    it('does not render an AddonCompatibilityError if it is not the current version', () => {
      getClientCompatibility.mockReturnValue(
        createFakeClientCompatibility({
          compatible: false,
          reason: INCOMPATIBLE_OVER_MAX_VERSION,
        }),
      );
      renderWithAddonAndVersions({
        versions: [fakeVersion, { ...fakeVersion, id: 2 }],
      });

      const versionCards = allVersionCards();
      expect(
        within(versionCards[0]).getByText(
          'This add-on is not compatible with your version of Firefox.',
        ),
      ).toBeInTheDocument();
      expect(
        within(versionCards[1]).queryByText(
          'This add-on is not compatible with your version of Firefox.',
        ),
      ).not.toBeInTheDocument();
    });

    it('passes an add-on to InstallButtonWrapper', () => {
      renderWithAddonAndVersions();

      expect(
        screen.getByRole('link', { name: 'Add to Firefox' }),
      ).toHaveAttribute('href', fakeVersion.file.url);
    });

    it('passes showLinkInsteadOfButton to InstallButtonWrapper for a non-current version', () => {
      const version1 = { ...fakeVersion, id: 1, version: '1.0' };
      const addon = {
        ...fakeAddon,
        slug: defaultSlug,
        current_version: version1,
      };
      const version2 = { ...fakeVersion, id: 2, version: '2.0' };

      _loadAddon(addon);
      _loadVersions({ versions: [version1, version2] });

      render();

      const versionCards = allVersionCards();
      expect(versionCards).toHaveLength(2);
      expect(
        within(versionCards[0]).getByRole('link', { name: 'Add to Firefox' }),
      ).toBeInTheDocument();
      expect(
        within(versionCards[1]).getByRole('link', { name: 'Download file' }),
      ).toBeInTheDocument();
    });

    describe('InstallWarning', () => {
      it('renders the InstallWarning if an add-on exists', () => {
        renderWithAddonAndVersions();

        expect(
          screen.getByText(
            `This add-on is not actively monitored for security by Mozilla. ` +
              `Make sure you trust it before installing.`,
          ),
        ).toBeInTheDocument();
      });

      it('does not render the InstallWarning if an add-on does not exist', () => {
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
        renderWithAddonAndVersions({
          addon: {
            ...fakeAddon,
            slug: defaultSlug,
            type: ADDON_TYPE_STATIC_THEME,
          },
        });

        expect(
          screen.queryByText(
            `This add-on is not actively monitored for security by Mozilla. ` +
              `Make sure you trust it before installing.`,
          ),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Tests for AddonCompatibilityError', () => {
    it('renders nothing if there is no addon', () => {
      render();

      expect(
        screen.queryByClassName('AddonCompatibilityError'),
      ).not.toBeInTheDocument();
    });

    it(`calls getClientCompatibility with the add-on's current version`, () => {
      const addon = { ...fakeAddon, slug: defaultSlug };
      dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX, store });
      renderWithAddonAndVersions({ addon });

      expect(getClientCompatibility).toHaveBeenCalledWith({
        addon: createInternalAddonWithLang(addon),
        clientApp: CLIENT_APP_FIREFOX,
        currentVersion: createInternalVersionWithLang(addon.current_version),
        userAgentInfo: store.getState().api.userAgentInfo,
      });
    });

    it('renders nothing if the add-on is compatible', () => {
      getClientCompatibility.mockReturnValue(
        createFakeClientCompatibility({
          compatible: true,
          reason: null,
        }),
      );
      renderWithAddonAndVersions();

      expect(
        screen.queryByClassName('AddonCompatibilityError'),
      ).not.toBeInTheDocument();
    });

    it('renders a notice if add-on is over maxVersion/compat is strict', () => {
      getClientCompatibility.mockReturnValue(
        createFakeClientCompatibility({
          compatible: false,
          reason: INCOMPATIBLE_OVER_MAX_VERSION,
        }),
      );
      renderWithAddonAndVersions();

      expect(
        screen.getByClassName('AddonCompatibilityError'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'This add-on is not compatible with your version of Firefox.',
        ),
      ).toBeInTheDocument();
    });

    it('renders a notice if add-on is incompatible with the platform', () => {
      getClientCompatibility.mockReturnValue(
        createFakeClientCompatibility({
          compatible: false,
          reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
        }),
      );
      renderWithAddonAndVersions();

      expect(
        screen.getByText('This add-on is not available on your platform.'),
      ).toBeInTheDocument();
    });

    it.each([
      INCOMPATIBLE_ANDROID_UNSUPPORTED,
      INCOMPATIBLE_FIREFOX_FOR_IOS,
      INCOMPATIBLE_NOT_FIREFOX,
      INCOMPATIBLE_UNDER_MIN_VERSION,
      'unknown reason',
    ])('renders nothing if the incompatibility reason is %s', (reason) => {
      getClientCompatibility.mockReturnValue(
        createFakeClientCompatibility({
          compatible: false,
          reason,
        }),
      );
      renderWithAddonAndVersions();

      expect(
        screen.queryByClassName('AddonCompatibilityError'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for InstallWarning', () => {
    const getInstallWarning = () =>
      screen.getByText(
        `This add-on is not actively monitored for security by Mozilla. ` +
          `Make sure you trust it before installing.`,
      );

    it('contains a correct link', () => {
      renderWithAddonAndVersions();

      expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
        'href',
        getPromotedBadgesLinkUrl({
          utm_content: 'install-warning',
        }),
      );
    });

    describe('couldShowWarning', () => {
      // This is a test for the happy path, but also serves as a sanity test for
      // renderWithAddonAndVersions returning the happy path.
      it('returns true if the userAgent and clientApp are both Firefox, and the add-on is an extension and is not promoted', () => {
        renderWithAddonAndVersions();

        expect(getInstallWarning()).toBeInTheDocument();
      });

      it('returns true if the userAgent is Firefox, clientApp Android and the add-on is an extension and is not promoted', () => {
        dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });
        renderWithAddonAndVersions({
          location: `/${lang}/${CLIENT_APP_ANDROID}/addon/${defaultSlug}/versions/`,
        });

        expect(getInstallWarning()).toBeInTheDocument();
      });

      it('returns false if the add-on is not an extension', () => {
        renderWithAddonAndVersions({
          addon: {
            ...fakeAddon,
            slug: defaultSlug,
            type: ADDON_TYPE_STATIC_THEME,
          },
        });

        expect(
          screen.queryByText(
            `This add-on is not actively monitored for security by Mozilla. ` +
              `Make sure you trust it before installing.`,
          ),
        ).not.toBeInTheDocument();
      });

      it('returns false if the add-on is promoted (but not STRATEGIC)', () => {
        renderWithAddonAndVersions({
          addon: {
            ...fakeAddon,
            slug: defaultSlug,
            promoted: { category: VERIFIED, apps: [CLIENT_APP_FIREFOX] },
          },
        });

        expect(
          screen.queryByText(
            `This add-on is not actively monitored for security by Mozilla. ` +
              `Make sure you trust it before installing.`,
          ),
        ).not.toBeInTheDocument();
      });

      it('returns true if the add-on is promoted in the STRATEGIC category', () => {
        renderWithAddonAndVersions({
          addon: {
            ...fakeAddon,
            slug: defaultSlug,
            promoted: { category: STRATEGIC, apps: [CLIENT_APP_FIREFOX] },
          },
        });

        expect(getInstallWarning()).toBeInTheDocument();
      });

      it('returns false if the userAgent is not Firefox', () => {
        dispatchClientMetadata({
          store,
          userAgent: userAgentsByPlatform.mac.chrome41,
        });
        renderWithAddonAndVersions();

        expect(
          screen.queryByText(
            `This add-on is not actively monitored for security by Mozilla. ` +
              `Make sure you trust it before installing.`,
          ),
        ).not.toBeInTheDocument();
      });

      it('returns false if the WrongPlatformWarning would be shown', () => {
        correctedLocationForPlatform.mockReturnValue('/some/path/');
        renderWithAddonAndVersions();

        expect(
          screen.queryByText(
            `This add-on is not actively monitored for security by Mozilla. ` +
              `Make sure you trust it before installing.`,
          ),
        ).not.toBeInTheDocument();
      });

      it('calls correctedLocationForPlatform with clientApp, location and userAgentInfo', () => {
        const userAgent = userAgentsByPlatform.mac.firefox57;
        const parsedUserAgent = UAParser(userAgent);
        dispatchClientMetadata({
          clientApp: CLIENT_APP_ANDROID,
          lang: 'fr',
          store,
          userAgent,
        });
        renderWithAddonAndVersions();

        expect(correctedLocationForPlatform).toHaveBeenCalledWith({
          clientApp: CLIENT_APP_ANDROID,
          lang: 'fr',
          location: expect.objectContaining({ pathname: getLocation() }),
          userAgentInfo: expect.objectContaining({
            browser: parsedUserAgent.browser,
            os: parsedUserAgent.os,
          }),
        });
      });
    });
  });
});
