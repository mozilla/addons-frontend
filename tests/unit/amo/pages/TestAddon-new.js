import serialize from 'serialize-javascript';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  STATIC_THEMES_REVIEW,
} from 'amo/constants';
import { getAddonByIdInURL, loadAddon } from 'amo/reducers/addons';
import { getVersionById } from 'amo/reducers/versions';
import tracking from 'amo/tracking';
import { getCanonicalURL } from 'amo/utils';
import { getAddonJsonLinkedData } from 'amo/utils/addons';
import {
  createHistory,
  createLocalizedString,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAddon,
  fakeAuthor,
  fakePreview,
  getElement,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

jest.mock('amo/tracking', () => ({
  ...jest.requireActual('amo/tracking'),
  sendEvent: jest.fn(),
  setDimension: jest.fn(),
}));

describe(__filename, () => {
  const authorUserId = 987;
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
      authors: [{ ...fakeAuthor, id: authorUserId }],
      id: defaultAddonId,
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
});
