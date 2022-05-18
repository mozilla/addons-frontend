import config from 'config';
import serialize from 'serialize-javascript';
import { cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  ADDON_QRCODE_CAMPAIGN,
  ADDON_QRCODE_CATEGORY,
  ADDON_QRCODE_CLICK_ACTION,
  ADDON_QRCODE_IMPRESSION_ACTION,
} from 'amo/components/AddonQRCode';
import {
  TAAR_IMPRESSION_CATEGORY,
  TAAR_COHORT_DIMENSION,
  TAAR_COHORT_INCLUDED,
  TAAR_EXPERIMENT_PARTICIPANT,
  TAAR_EXPERIMENT_PARTICIPANT_DIMENSION,
} from 'amo/components/AddonRecommendations';
import {
  CONTRIBUTE_BUTTON_CLICK_ACTION,
  CONTRIBUTE_BUTTON_CLICK_CATEGORY,
} from 'amo/components/ContributeCard';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  ADDONS_CONTENT_REVIEW,
  ADDONS_EDIT,
  ADDONS_REVIEW,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_MEDIUM,
  DEFAULT_UTM_SOURCE,
  RECOMMENDED,
  STATIC_THEMES_REVIEW,
} from 'amo/constants';
import { ADDONS_BY_AUTHORS_COUNT } from 'amo/pages/Addon';
import { getAddonByIdInURL, loadAddon } from 'amo/reducers/addons';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  FETCH_ADDONS_BY_AUTHORS,
  fetchAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import {
  FETCH_RECOMMENDATIONS,
  OUTCOME_CURATED,
  OUTCOME_RECOMMENDED,
  OUTCOME_RECOMMENDED_FALLBACK,
  fetchRecommendations,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import { getVersionById } from 'amo/reducers/versions';
import tracking from 'amo/tracking';
import { getCanonicalURL, getPromotedBadgesLinkUrl } from 'amo/utils';
import { getAddonJsonLinkedData } from 'amo/utils/addons';
import {
  createHistory,
  createFailedErrorHandler,
  createLocalizedString,
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
  onLocationChanged,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

jest.mock('amo/tracking', () => ({
  ...jest.requireActual('amo/tracking'),
  sendEvent: jest.fn(),
  setDimension: jest.fn(),
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

  const getLocation = ({ page, slug = defaultSlug } = {}) => {
    return `/${lang}/${clientApp}/addon/${slug}/${
      page ? `?page=${page}/` : ''
    }`;
  };

  beforeEach(() => {
    addon = {
      ...fakeAddon, // By default loads an add-on with an expected author.
      authors: [fakeAuthors[0]],
      id: defaultAddonId,
      name: createLocalizedString(defaultAddonName),
      slug: defaultSlug,
    };
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = ({ location, slug = defaultSlug } = {}) => {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || getLocation(slug)],
      }),
      store,
    };

    return defaultRender(renderOptions);
  };

  const _loadAddon = () => {
    store.dispatch(loadAddon({ addon, slug: addon.slug }));
  };

  const renderWithPermissions = ({ permissions, ...props }) => {
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    dispatchSignInActionsWithStore({
      store,
      userProps: { permissions: perms },
    });
    return render(props);
  };

  const createVersionWithPermissions = ({
    optional = [],
    required = [],
    versionProps = {},
  } = {}) => {
    return {
      ...fakeVersion,
      file: {
        ...fakeFile,
        optional_permissions: optional,
        permissions: required,
      },

      ...versionProps,
    };
  };

  const mockClientHeight = (height) =>
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: height,
    });

  describe('Tests for ThemeImage', () => {
    it('renders a theme image when add-on is a static theme', () => {
      const addonName = 'Some add-on name';
      addon.name = createLocalizedString(addonName);
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();
      render();

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
      _loadAddon();
      render();

      expect(
        screen.queryByClassName('ThemeImage-image'),
      ).not.toBeInTheDocument();
    });

    it('renders a theme image with rounded corners', () => {
      const addonName = 'Some add-on name';
      addon.name = createLocalizedString(addonName);
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();
      render();

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
      _loadAddon();
      render();

      expect(screen.getByAltText(`Preview of ${addonName}`)).toHaveAttribute(
        'src',
        fullImage720,
      );
    });
  });

  describe('Tests for AddonAdminLinks', () => {
    it('shows Admin Links if the user has permission for a link', () => {
      _loadAddon();
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
    });

    it('does not show Admin Links if there is no add-on', () => {
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.queryByText('Admin Links')).not.toBeInTheDocument();
    });

    it('does not show Admin Links if the user does not have permission for a link', () => {
      _loadAddon();
      render();

      expect(screen.queryByText('Admin Links')).not.toBeInTheDocument();
    });

    it('shows edit and admin add-on links if the user has permission', () => {
      _loadAddon();
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
      _loadAddon();
      renderWithPermissions({ permissions: ADDONS_REVIEW });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(screen.queryByText('Edit add-on')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin add-on')).not.toBeInTheDocument();
    });

    it('shows a content review link if the user has permission', () => {
      _loadAddon();
      renderWithPermissions({ permissions: ADDONS_CONTENT_REVIEW });

      expect(
        screen.getByRole('link', { name: 'Content review add-on' }),
      ).toHaveAttribute('href', `/reviewers/review-content/${defaultAddonId}`);
    });

    it('does not show a content review link if the user does not have permission', () => {
      _loadAddon();
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(
        screen.queryByText('Content review add-on'),
      ).not.toBeInTheDocument();
    });

    it('does not show a content review link for a theme', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();
      renderWithPermissions({
        permissions: [ADDONS_CONTENT_REVIEW, ADDONS_EDIT],
      });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(
        screen.queryByText('Content review add-on'),
      ).not.toBeInTheDocument();
    });

    it('shows a code review link for an extension if the user has permission', () => {
      _loadAddon();
      renderWithPermissions({ permissions: ADDONS_REVIEW });

      expect(
        screen.getByRole('link', { name: 'Review add-on code' }),
      ).toHaveAttribute('href', `/reviewers/review/${defaultAddonId}`);
    });

    it('does not show a code review link if the user does not have permission', () => {
      _loadAddon();
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(screen.queryByText('Review add-on code')).not.toBeInTheDocument();
    });

    it('shows a theme review link for a static theme if the user has permission', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();
      renderWithPermissions({ permissions: STATIC_THEMES_REVIEW });

      expect(
        screen.getByRole('link', { name: 'Review theme' }),
      ).toHaveAttribute('href', `/reviewers/review/${defaultAddonId}`);
    });

    it('does not show a theme review link if the user does not have permission', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();
      renderWithPermissions({ permissions: ADDONS_EDIT });

      expect(screen.getByText('Admin Links')).toBeInTheDocument();
      expect(screen.queryByText('Review theme')).not.toBeInTheDocument();
    });

    it('does not show a theme review link if the user has permission but the add-on is not a theme', () => {
      _loadAddon();
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
      _loadAddon();
      render();

      expect(screen.getByText('Author Links')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Edit add-on' })).toHaveAttribute(
        'href',
        `/developers/addon/${defaultSlug}/edit`,
      );
    });

    it('does not show Author Links if the user is not logged in', () => {
      _loadAddon();
      render();

      expect(screen.queryByText('Author Links')).not.toBeInTheDocument();
    });

    it('does not show Author Links if a signed-in user is not the author of the add-on', () => {
      dispatchSignInActionsWithStore({ store, userId: authorUserId + 1 });
      _loadAddon();
      render();

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
      _loadAddon();
      render();

      await waitFor(() =>
        expect(getElement('link[rel="canonical"]')).toBeInTheDocument(),
      );

      expect(getElement('link[rel="canonical"]')).toHaveAttribute(
        'href',
        getCanonicalURL({ locationPathname: getLocation() }),
      );
    });

    it('renders meta tags via the HeadMetaTags component', async () => {
      const summary = 'An add-on summary';
      addon.name = createLocalizedString(addonName);
      addon.summary = createLocalizedString(summary);
      _loadAddon();
      render();

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
      expect(getElement('meta[name="twitter:site"]')).toHaveAttribute(
        'content',
        '@mozamo',
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
        _loadAddon();
        render();

        await waitFor(() => expect(getElement('title')).toBeInTheDocument());

        expect(getElement('title')).toHaveTextContent(
          `${addonName} – Get this ${name} for 🦊 Firefox (${lang})`,
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
        _loadAddon();
        render({
          location: `/${lang}/${CLIENT_APP_ANDROID}/addon/${defaultSlug}/`,
        });

        await waitFor(() => expect(getElement('title')).toBeInTheDocument());

        expect(getElement('title')).toHaveTextContent(
          `${addonName} – Get this ${name} for 🦊 Firefox Android (${lang})`,
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
      _loadAddon();

      render();

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
      _loadAddon();

      expect(screen.queryByText('Contribute now')).not.toBeInTheDocument();
    });

    it('renders a Button with a contributions URL', () => {
      addon.contributions_url = contributionsURL;
      _loadAddon();
      render();

      expect(screen.getByText('Contribute now')).toBeInTheDocument();
      const link = screen.getByTitle(url);
      expect(link).toHaveAttribute('href', outgoing);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveTextContent('Contribute now');
    });

    it('displays content for an extension developer', () => {
      addon.contributions_url = contributionsURL;
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

      expect(screen.getByText('Support these authors')).toBeInTheDocument();
      expect(
        screen.getByText(
          `The authors of this add-on ask that you help support its ` +
            `continued work by making a small contribution.`,
        ),
      ).toBeInTheDocument();
    });

    it('sends a tracking event when the button is clicked', () => {
      addon.contributions_url = contributionsURL;
      _loadAddon();
      render();

      userEvent.click(screen.getByTitle(url));

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
        _loadAddon();
        render();

        expect(screen.queryByText('Permissions')).not.toBeInTheDocument();
      });

      it('renders nothing for a version with no permissions', () => {
        addon.current_version = createVersionWithPermissions();
        _loadAddon();
        render();

        expect(screen.queryByText('Permissions')).not.toBeInTheDocument();
      });

      it('renders nothing for a version with no displayable permissions', () => {
        addon.current_version = createVersionWithPermissions({
          optional: ['activeTab'],
          required: ['activeTab'],
        });
        _loadAddon();
        render();

        expect(screen.queryByText('Permissions')).not.toBeInTheDocument();
      });
    });

    describe('with permissions', () => {
      it('passes the expected contentId to ShowMoreCard', () => {
        // Mock the clientHeight so the "read more" link will be present.
        mockClientHeight(301);

        const versionId = 12345;
        addon.current_version = createVersionWithPermissions({
          required: ['bookmarks'],
          versionProps: { id: versionId },
        });
        _loadAddon();
        render();

        const permissionsCard = screen.getByClassName('PermissionsCard');
        expect(permissionsCard).not.toHaveClass('ShowMoreCard--expanded');

        // Click the link to expand the ShowMoreCard.
        userEvent.click(
          within(permissionsCard).getByRole('link', {
            name: 'Expand to read more',
          }),
        );

        // It should be expanded now.
        expect(permissionsCard).toHaveClass('ShowMoreCard--expanded');

        // Update with the same version id, which should change nothing.
        _loadAddon();

        // It should still be expanded.
        expect(permissionsCard).toHaveClass('ShowMoreCard--expanded');

        // Update to a different version id.
        addon.current_version = createVersionWithPermissions({
          required: ['bookmarks'],
          versionProps: { id: versionId + 1 },
        });
        _loadAddon();

        // It should revert to not being expanded.
        expect(permissionsCard).not.toHaveClass('ShowMoreCard--expanded');
      });

      it('renders learn more link in header', () => {
        addon.current_version = createVersionWithPermissions({
          required: ['bookmarks'],
        });
        _loadAddon();
        render();

        expect(screen.getByText('Permissions')).toBeInTheDocument();
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
        _loadAddon();
        render();

        expect(screen.getByText('This add-on needs to:')).toHaveClass(
          'PermissionsCard-subhead--required',
        );
        expect(within(getPermissionsCard()).getByTagName('ul')).toHaveClass(
          'PermissionsCard-list--required',
        );
        expect(
          screen.getByClassName('Icon-permission-bookmarks'),
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
          optional: ['bookmarks'],
        });
        _loadAddon();
        render();

        expect(screen.getByText('This add-on may also ask to:')).toHaveClass(
          'PermissionsCard-subhead--optional',
        );
        expect(within(getPermissionsCard()).getByTagName('ul')).toHaveClass(
          'PermissionsCard-list--optional',
        );
        expect(
          screen.getByClassName('Icon-permission-bookmarks'),
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
          optional: ['bookmarks'],
          required: ['history'],
        });
        _loadAddon();
        render();

        expect(screen.getByText('This add-on needs to:')).toHaveClass(
          'PermissionsCard-subhead--required',
        );
        expect(screen.getByText('This add-on may also ask to:')).toHaveClass(
          'PermissionsCard-subhead--optional',
        );
        expect(
          screen.getByClassName('Icon-permission-bookmarks'),
        ).toBeInTheDocument();
        expect(
          screen.getByClassName('Icon-permission-history'),
        ).toBeInTheDocument();
        expect(
          screen.getByClassName('PermissionsCard-list--required'),
        ).toBeInTheDocument();
        expect(
          screen.getByClassName('PermissionsCard-list--optional'),
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
          '*://*.mozilla.co.nz/*',
          '*://*.mozilla.co.uk/*',
        ],
      });
      _loadAddon();
      render();

      expect(
        screen.getAllByClassName('Icon-permission-hostPermission'),
      ).toHaveLength(6);
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
          '*://testing.mozilla.org/*',
          '*://awesome.mozilla.org/*',
        ],
      });
      _loadAddon();
      render();

      expect(
        screen.getAllByClassName('Icon-permission-hostPermission'),
      ).toHaveLength(5);
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

    it('returns a single host permission for all urls', () => {
      const permissions = [
        '*://*.mozilla.com/*',
        '*://developer.mozilla.org/*',
      ];
      for (const allUrlsPermission of ['<all_urls>', '*://*/']) {
        addon.current_version = createVersionWithPermissions({
          required: [...permissions, allUrlsPermission],
        });
        _loadAddon();
        render();

        expect(
          screen.getAllByClassName('Icon-permission-hostPermission'),
        ).toHaveLength(1);
        expect(
          screen.getByText('Access your data for all websites'),
        ).toBeInTheDocument();
        cleanup();
      }
    });

    it('does not return a host permission for moz-extension: urls', () => {
      addon.current_version = createVersionWithPermissions({
        required: ['moz-extension://should/not/generate/a/permission/'],
      });
      _loadAddon();
      render();

      expect(screen.queryByClassName('Permission')).not.toBeInTheDocument();
    });

    it('does not return a host permission for an invalid pattern', () => {
      addon.current_version = createVersionWithPermissions({
        required: ['*'],
      });
      _loadAddon();
      render();

      expect(screen.queryByClassName('Permission')).not.toBeInTheDocument();
    });

    it('deduplicates domain and site permissions', () => {
      addon.current_version = createVersionWithPermissions({
        required: [
          'https://*.okta.com/',
          'https://*.okta.com/login/login.htm*',
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
      });
      _loadAddon();
      render();

      expect(
        screen.getAllByClassName('Icon-permission-hostPermission'),
      ).toHaveLength(8);
      expect(
        screen.getByText('Access your data for sites in the okta.com domain'),
      ).toBeInTheDocument();
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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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

    it('should dispatch a fetch action if no recommendations exist', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      _loadAddon();
      render();

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

    it('should dispatch a fetch action if the addon is updated', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const newGuid = `${addon.guid}-new`;
      const newSlug = `${defaultSlug}-new`;
      _loadAddon();
      render();

      dispatch.mockClear();

      store.dispatch(
        loadAddon({
          addon: { ...fakeAddon, guid: newGuid, slug: newSlug },
          slug: newSlug,
        }),
      );
      store.dispatch(
        onLocationChanged({
          pathname: getLocation({ slug: newSlug }),
        }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        fetchRecommendations({
          errorHandlerId: thisErrorHandlerId,
          guid: newGuid,
        }),
      );
    });

    it('should not dispatch a fetch if the addon is updated but not changed', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      _loadAddon();
      render();

      dispatch.mockClear();

      store.dispatch(
        onLocationChanged({
          pathname: getLocation(),
        }),
      );

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_RECOMMENDATIONS }),
      );
    });

    it('should not dispatch a fetch if the addon is updated to null', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const newSlug = `${defaultSlug}-new`;
      _loadAddon();
      render();

      dispatch.mockClear();

      // Switch to a different add-on, that has not been loaded.
      store.dispatch(
        onLocationChanged({
          pathname: getLocation({ slug: newSlug }),
        }),
      );

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_RECOMMENDATIONS }),
      );
    });

    it('should send a GA ping when recommendations are loaded', () => {
      const fallbackReason = 'timeout';
      const outcome = OUTCOME_RECOMMENDED_FALLBACK;
      _loadAddon();
      render();

      doLoadRecommendations({
        outcome,
        fallbackReason,
      });

      expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
      expect(tracking.sendEvent).toHaveBeenCalledWith({
        action: `${outcome}-${fallbackReason}`,
        category: TAAR_IMPRESSION_CATEGORY,
        label: addon.guid,
      });
    });

    it('should set GA custom dimensions', () => {
      _loadAddon();
      render();

      expect(tracking.setDimension).toHaveBeenCalledTimes(2);
      expect(tracking.setDimension).toHaveBeenCalledWith({
        dimension: TAAR_COHORT_DIMENSION,
        value: TAAR_COHORT_INCLUDED,
      });
      expect(tracking.setDimension).toHaveBeenCalledWith({
        dimension: TAAR_EXPERIMENT_PARTICIPANT_DIMENSION,
        value: TAAR_EXPERIMENT_PARTICIPANT,
      });
    });

    it('should send a GA ping without a fallback', () => {
      const fallbackReason = null;
      const outcome = OUTCOME_RECOMMENDED;
      _loadAddon();
      render();

      doLoadRecommendations({
        outcome,
        fallbackReason,
      });

      expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
      expect(tracking.sendEvent).toHaveBeenCalledWith({
        action: outcome,
        category: TAAR_IMPRESSION_CATEGORY,
        label: addon.guid,
      });
    });

    it('should not send a GA ping when recommendations are loading', () => {
      doFetchRecommendations();
      _loadAddon();
      render();

      expect(tracking.sendEvent).not.toHaveBeenCalled();
    });

    it('should not send a GA ping when there an error', () => {
      createFailedErrorHandler({ id: thisErrorHandlerId, store });
      _loadAddon();
      render();

      expect(tracking.sendEvent).not.toHaveBeenCalled();
    });
  });

  describe('more add-ons by authors', () => {
    it('puts "add-ons by author" in main content if type is theme', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

      expect(
        screen.queryByClassName('AddonsByAuthorsCard'),
      ).not.toBeInTheDocument();
    });

    it('displays more add-ons by authors for an extension', () => {
      const moreAddonName = 'Name of more add-on';
      _loadAddon();
      render();

      loadAddonsByAuthors({
        addonName: moreAddonName,
        addonType: ADDON_TYPE_EXTENSION,
        count: 2,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonsByAuthorsCard = screen.getByClassName('AddonsByAuthorsCard');
      expect(
        within(addonsByAuthorsCard).getByText(
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

    it('displays more add-ons by authors for a theme', () => {
      const moreAddonName = 'Name of more add-on';
      addon.type = ADDON_TYPE_STATIC_THEME;
      _loadAddon();
      render();

      loadAddonsByAuthors({
        addonName: moreAddonName,
        addonType: ADDON_TYPE_STATIC_THEME,
        count: 2,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonsByAuthorsCard = screen.getByClassName('AddonsByAuthorsCard');
      expect(
        within(addonsByAuthorsCard).getByText(`More themes by ${authorName}`),
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

    it('adds a CSS class to the main component when there are add-ons', () => {
      _loadAddon();
      render();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 1,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonComponent = screen.getByClassName('Addon');

      expect(addonComponent).toHaveClass('Addon--has-more-than-0-addons');
      expect(addonComponent).not.toHaveClass('Addon--has-more-than-3-addons');
    });

    it('adds a CSS class when there are more than 3 other add-ons', () => {
      _loadAddon();
      render();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 4,
        forAddonSlug: defaultSlug,
        store,
      });

      const addonComponent = screen.getByClassName('Addon');

      expect(addonComponent).toHaveClass('Addon--has-more-than-0-addons');
      expect(addonComponent).toHaveClass('Addon--has-more-than-3-addons');
    });
  });

  describe('Tests for AddonsByAuthorsCard', () => {
    const getThisErrorHandlerId = (type) => `AddonsByAuthorsCard-${type}`;

    it('should render nothing if there are no add-ons', () => {
      _loadAddon();
      render();

      loadAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        count: 0,
        forAddonSlug: defaultSlug,
        store,
      });

      expect(
        screen.queryByClassName('AddonsByAuthorsCard'),
      ).not.toBeInTheDocument();
    });

    it('should render a loading state on first instantiation', () => {
      _loadAddon();
      render();

      // Expect 6 placeholders with 4 LoadingText each.
      expect(
        within(screen.getByClassName('AddonsByAuthorsCard')).getAllByRole(
          'alert',
        ),
      ).toHaveLength(24);
    });

    it('should render a card with loading state if loading', () => {
      _loadAddon();
      store.dispatch(
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorIds: [authorUserId],
          errorHandlerId: getThisErrorHandlerId(ADDON_TYPE_EXTENSION),
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );
      render();

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
      _loadAddon();
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

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

    it('should dispatch a fetch action if authorIds are updated', () => {
      _loadAddon();
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

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

      store.dispatch(
        onLocationChanged({
          pathname: getLocation({ slug: newSlug }),
        }),
      );

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

      store.dispatch(
        onLocationChanged({
          pathname: getLocation({ slug: anotherSlug }),
        }),
      );

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

    it('should dispatch a fetch action if addonType is updated', () => {
      _loadAddon();
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

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

      store.dispatch(
        onLocationChanged({
          pathname: getLocation({ slug: newSlug }),
        }),
      );

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

    it('should not dispatch a fetch action if props are not changed', () => {
      _loadAddon();
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

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

      store.dispatch(
        onLocationChanged({
          pathname: getLocation({ slug: defaultSlug }),
        }),
      );

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_ADDONS_BY_AUTHORS }),
      );
    });

    it.each([ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME])(
      'should display at most numberOfAddons for %s',
      (type) => {
        addon.type = type;
        _loadAddon();
        render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      render();

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
      _loadAddon();
      createFailedErrorHandler({
        id: getThisErrorHandlerId(ADDON_TYPE_EXTENSION),
        message,
        store,
      });
      render();

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Tests for PromotedBadge', () => {
    const renderWithPromotedCategory = (category = RECOMMENDED) => {
      addon.promoted = { category, apps: [clientApp] };
      _loadAddon();
      render();
    };

    it('can be rendered as large', () => {
      renderWithPromotedCategory();

      expect(screen.getByClassName('PromotedBadge')).toHaveClass(
        'PromotedBadge-large',
      );
      expect(screen.getByClassName('IconPromotedBadge')).toHaveClass(
        'IconPromotedBadge-large',
      );
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
      [
        'verified',
        'This add-on has been reviewed to meet our standards for security and performance.',
        'Verified',
      ],
    ])(
      'renders the category "%s" as expected',
      (category, linkTitle, label) => {
        renderWithPromotedCategory(category);

        expect(screen.getByClassName('PromotedBadge')).toHaveClass(
          `PromotedBadge--${category}`,
        );

        const link = screen.getByTitle(linkTitle);
        expect(link).toHaveAttribute(
          'href',
          getPromotedBadgesLinkUrl({
            utm_content: 'promoted-addon-badge',
          }),
        );
        expect(link).toHaveClass(`PromotedBadge-link--${category}`);

        expect(screen.getByText(label)).toHaveClass(
          `PromotedBadge-label--${category}`,
        );

        if (category !== 'line') {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(
            screen.getByClassName('IconPromotedBadge-iconPath'),
          ).toHaveClass(`IconPromotedBadge-iconPath--${category}`);
        }
      },
    );

    // See https://github.com/mozilla/addons-frontend/issues/8285.
    it('does not pass an alt property to IconPromotedBadge', () => {
      renderWithPromotedCategory();

      expect(
        // eslint-disable-next-line testing-library/prefer-presence-queries
        within(screen.getByClassName('PromotedBadge')).queryByClassName(
          'visually-hidden',
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for AddonBadges', () => {
    it('returns null when there is no add-on', () => {
      render();

      expect(screen.queryByClassName('AddonBadges')).not.toBeInTheDocument();
    });

    it('displays no badges when none are called for', () => {
      _loadAddon();
      render();

      expect(
        // eslint-disable-next-line testing-library/prefer-presence-queries
        within(screen.getByClassName('AddonBadges')).queryByTagName('div'),
      ).not.toBeInTheDocument();
    });

    it('displays a badge when the addon is experimental', () => {
      addon.is_experimental = true;
      _loadAddon();
      render();

      expect(screen.getByClassName('Badge-experimental')).toHaveTextContent(
        'Experimental',
      );
    });

    it('displays a badge when the addon requires payment', () => {
      addon.requires_payment = true;
      _loadAddon();
      render();

      expect(screen.getByClassName('Badge-requires-payment')).toHaveTextContent(
        'Some features may require payment',
      );
    });
  });

  describe('Tests for AddonQRCode', () => {
    const goodAddonId = 12345;
    const baseConfigOverride = {
      addonIdsWithQRCodes: [goodAddonId],
      enableFeatureAddonQRCode: true,
    };
    let fakeConfig = getMockConfig(baseConfigOverride);
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });

    beforeEach(() => {
      addon.id = goodAddonId;
    });

    const openQRCodeOverlay = () =>
      userEvent.click(
        screen.getByRole('button', {
          name: 'Also available on Firefox for Android',
        }),
      );

    const clickLink = () =>
      userEvent.click(screen.getByRole('link', { name: 'this link' }));

    it('renders a link with the expected destination', () => {
      _loadAddon();
      render();

      openQRCodeOverlay();

      const queryString = [
        `utm_source=${DEFAULT_UTM_SOURCE}`,
        `utm_medium=${DEFAULT_UTM_MEDIUM}`,
        `utm_campaign=${ADDON_QRCODE_CAMPAIGN}`,
        `utm_content=${addon.id}`,
      ].join('&');
      const destination = `/${lang}/${CLIENT_APP_ANDROID}/addon/${defaultSlug}/?${queryString}`;

      expect(screen.getByRole('link', { name: 'this link' })).toHaveAttribute(
        'href',
        destination,
      );
    });

    it('renders a label with the expected text', () => {
      _loadAddon();
      render();

      openQRCodeOverlay();

      expect(screen.getByClassName('AddonQRCode-label')).toHaveTextContent(
        `To get ${defaultAddonName} on Firefox for Android, point your device camera to the code above or copy this link`,
      );
      expect(
        screen.getByTextAcrossTags(
          `To get ${defaultAddonName} on Firefox for Android, point your ` +
            `device camera to the code above or copy this link`,
        ),
      ).toBeInTheDocument();
    });

    it('renders an img with the expected src and alt text', () => {
      const staticPath = '/some-static/path/';
      fakeConfig = getMockConfig({ ...baseConfigOverride, staticPath });
      config.get.mockImplementation((key) => {
        return fakeConfig[key];
      });
      _loadAddon();
      render();

      openQRCodeOverlay();

      expect(
        screen.getByAltText(`Get ${defaultAddonName} for Android`),
      ).toHaveAttribute('src', `${staticPath}${goodAddonId}.png?v=2`);
    });

    it('closes the overlay when the dismiss button is clicked', () => {
      _loadAddon();
      render();

      openQRCodeOverlay();

      userEvent.click(
        screen.getByRole('button', { name: 'Dismiss this message' }),
      );

      expect(
        screen.queryByRole('link', { name: 'this link' }),
      ).not.toBeInTheDocument();
    });

    it('closes the overlay when the link is clicked', () => {
      _loadAddon();
      render();

      openQRCodeOverlay();
      clickLink();

      expect(
        screen.queryByRole('link', { name: 'this link' }),
      ).not.toBeInTheDocument();
    });

    describe('tracking', () => {
      it('sends a tracking event for the impression on mount', () => {
        _loadAddon();
        render();

        openQRCodeOverlay();

        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(tracking.sendEvent).toHaveBeenCalledWith({
          action: ADDON_QRCODE_IMPRESSION_ACTION,
          category: ADDON_QRCODE_CATEGORY,
          label: String(goodAddonId),
        });
      });

      it('sends a tracking event when the link is clicked', () => {
        _loadAddon();
        render();

        openQRCodeOverlay();

        tracking.sendEvent.mockClear();
        clickLink();

        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(tracking.sendEvent).toHaveBeenCalledWith({
          action: ADDON_QRCODE_CLICK_ACTION,
          category: ADDON_QRCODE_CATEGORY,
          label: String(goodAddonId),
        });
      });
    });

    describe('Tests for AddonQRCodeLink', () => {
      describe('flag enabled', () => {
        it('displays a link for a QR code on desktop, for an applicable add-on', () => {
          _loadAddon();
          render();

          expect(
            screen.getByRole('button', {
              name: 'Also available on Firefox for Android',
            }),
          ).toBeInTheDocument();
        });

        it('does not display a link for a QR code on desktop, with no add-on', () => {
          render();

          expect(
            screen.queryByRole('button', {
              name: 'Also available on Firefox for Android',
            }),
          ).not.toBeInTheDocument();
        });

        it('does not display a link for a QR code on desktop, for an invalid add-on', () => {
          addon.id = goodAddonId + 1;
          _loadAddon();
          render();

          expect(
            screen.queryByRole('button', {
              name: 'Also available on Firefox for Android',
            }),
          ).not.toBeInTheDocument();
        });

        it('does not display a link for a QR code on mobile, for an applicable add-on', () => {
          dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });
          _loadAddon();
          render({
            location: `/${lang}/${CLIENT_APP_ANDROID}/addon/${defaultSlug}/`,
          });

          expect(
            screen.queryByRole('button', {
              name: 'Also available on Firefox for Android',
            }),
          ).not.toBeInTheDocument();
        });
      });

      it('does not display a link for a QR code on desktop, for an applicable add-on, with the flag disabled', () => {
        fakeConfig = getMockConfig({
          ...baseConfigOverride,
          enableFeatureAddonQRCode: false,
        });
        config.get.mockImplementation((key) => {
          return fakeConfig[key];
        });
        _loadAddon();
        render();

        expect(
          screen.queryByRole('button', {
            name: 'Also available on Firefox for Android',
          }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
