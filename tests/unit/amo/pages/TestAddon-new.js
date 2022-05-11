import { loadAddon } from 'amo/reducers/addons';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import {
  createHistory,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  fakeAuthor,
  fakePreview,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

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
    return loadAddon({ addon, slug: addon.slug });
  };

  describe('Tests for ThemeImage', () => {
    it('renders a theme image when add-on is a static theme', () => {
      const addonName = 'Some add-on name';
      addon.name = createLocalizedString(addonName);
      addon.type = ADDON_TYPE_STATIC_THEME;
      store.dispatch(_loadAddon());
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
      store.dispatch(_loadAddon());
      render();

      expect(
        screen.queryByClassName('ThemeImage-image'),
      ).not.toBeInTheDocument();
    });

    it('renders a theme image with rounded corners', () => {
      const addonName = 'Some add-on name';
      addon.name = createLocalizedString(addonName);
      addon.type = ADDON_TYPE_STATIC_THEME;
      store.dispatch(_loadAddon());
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
      store.dispatch(_loadAddon());
      render();

      expect(screen.getByAltText(`Preview of ${addonName}`)).toHaveAttribute(
        'src',
        fullImage720,
      );
    });
  });
});
