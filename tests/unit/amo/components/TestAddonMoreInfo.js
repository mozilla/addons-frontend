import * as React from 'react';

import { createApiError } from 'amo/api';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import { ErrorHandler } from 'amo/errorHandler';
import { setClientApp } from 'amo/reducers/api';
import { loadCategories } from 'amo/reducers/categories';
import { loadVersions } from 'amo/reducers/versions';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  ADDONS_EDIT,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  STATS_VIEW,
} from 'amo/constants';
import { formatFilesize } from 'amo/i18n/utils';
import {
  createInternalAddonWithLang,
  createLocalizedString,
  createStubErrorHandler,
  DEFAULT_LANG_IN_TESTS,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeAuthor,
  fakeCategory,
  fakeI18n,
  fakeFile,
  fakeVersion,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render({ location, ...props } = {}) {
    const errorHandler = createStubErrorHandler();
    const allProps = {
      addon: createInternalAddonWithLang(fakeAddon),
      errorHandler,
      ...props,
    };

    const renderOptions = { store };
    if (location) {
      renderOptions.initialEntries = [location];
    }

    return defaultRender(<AddonMoreInfo {...allProps} />, renderOptions);
  }

  it('renders LoadingText if no add-on is present', () => {
    render({ addon: null });

    // These fields will be visible during loading since
    // they will always exist for the loaded add-on.
    expect(screen.getByText('Last updated')).toBeInTheDocument();

    expect(screen.getByClassName('LoadingText')).toBeInTheDocument();

    // These fields will not be visible during loading
    // since they may not exist.
    expect(screen.queryByText('Add-on Links')).not.toBeInTheDocument();
    expect(screen.queryByText('License')).not.toBeInTheDocument();
    expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument();
    expect(screen.queryByText('Version')).not.toBeInTheDocument();
    expect(screen.queryByText('Version History')).not.toBeInTheDocument();
    expect(
      screen.queryByText('End-User License Agreement'),
    ).not.toBeInTheDocument();
  });

  it('renders an "Add-on Links" heading if links exist', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: null,
      support_url: {
        url: createLocalizedString('foo.com'),
        outgoing: createLocalizedString('baa.com'),
      },
    });
    render({ addon });

    expect(screen.getByText('Add-on Links')).toBeInTheDocument();
  });

  it('renders an "Add-on Links" heading if support email exists', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: null,
      support_url: null,
      support_email: createLocalizedString('hello@foo.com'),
    });
    render({ addon });

    expect(screen.getByText('Add-on Links')).toBeInTheDocument();
  });

  it('does not render an "Add-on Links" heading if no links exist', () => {
    const partialAddon = createInternalAddonWithLang(fakeAddon);
    delete partialAddon.homepage;
    delete partialAddon.support_email;
    delete partialAddon.support_url;
    render({ addon: partialAddon });

    expect(screen.queryByText('Add-on Links')).not.toBeInTheDocument();
  });

  it('does not render a homepage if none exists', () => {
    const partialAddon = createInternalAddonWithLang(fakeAddon);
    delete partialAddon.homepage;
    render({ addon: partialAddon });

    expect(screen.queryByText('Homepage')).not.toBeInTheDocument();
  });

  it('does not render an "Add-on Links" heading if support email is not valid', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: null,
      support_url: null,
      support_email: createLocalizedString('invalid-email'),
    });
    render({ addon });

    expect(screen.queryByText('Add-on Links')).not.toBeInTheDocument();
  });

  it('renders the homepage of an add-on', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: {
        url: createLocalizedString('http://hamsterdance.com/'),
        outgoing: createLocalizedString('https://outgoing.mozilla.org/hamster'),
      },
    });
    render({ addon });

    const link = screen.getByText('Homepage');
    expect(link).toHaveAttribute(
      'href',
      'https://outgoing.mozilla.org/hamster',
    );
    expect(link).toHaveAttribute('title', 'http://hamsterdance.com/');
  });

  it('does not render a support link if none exists', () => {
    const partialAddon = createInternalAddonWithLang(fakeAddon);
    delete partialAddon.support_url;
    render({ addon: partialAddon });

    expect(screen.queryByText('Support site')).not.toBeInTheDocument();
  });

  it('renders the support link of an add-on', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      support_url: {
        url: createLocalizedString('http://support.hamsterdance.com/'),
        outgoing: createLocalizedString('https://outgoing.mozilla.org/hamster'),
      },
    });
    render({ addon });

    const link = screen.getByText('Support site');
    expect(link).toHaveAttribute(
      'href',
      'https://outgoing.mozilla.org/hamster',
    );
    expect(link).toHaveAttribute('title', 'http://support.hamsterdance.com/');
  });

  it('renders the email link of an add-on', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      support_email: createLocalizedString('ba@bar.com'),
    });
    render({ addon });

    const link = screen.getByText('Support Email');
    expect(link).toHaveAttribute('href', 'mailto:ba@bar.com');
    expect(link).toHaveAttribute('lang', DEFAULT_LANG_IN_TESTS);
  });

  const _loadVersions = (versionProps = {}) => {
    store.dispatch(
      loadVersions({
        slug: fakeAddon.slug,
        versions: [
          {
            ...fakeVersion,
            ...versionProps,
          },
        ],
      }),
    );
  };

  it('renders the version number of an add-on', () => {
    _loadVersions({ version: '2.0.1' });
    render();

    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('2.0.1')).toBeInTheDocument();
  });

  it('renders file size of an add-on', () => {
    const size = 10;
    _loadVersions({
      file: {
        ...fakeFile,
        size,
      },
    });
    render();

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(
      screen.getByText(formatFilesize({ size, i18n: fakeI18n() })),
    ).toBeInTheDocument();
  });

  it('renders a non-custom license and link', () => {
    const licenseName = 'some license';
    const licenseUrl = 'http://license.com/';
    _loadVersions({
      license: {
        is_custom: false,
        name: createLocalizedString(licenseName),
        url: licenseUrl,
      },
    });
    render();

    expect(screen.getByText('License')).toBeInTheDocument();
    const link = screen.getByText(licenseName);
    expect(link).toHaveAttribute('href', licenseUrl);
  });

  it('renders a custom license link', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const licenseName = 'some license';
    _loadVersions({
      license: {
        is_custom: true,
        name: createLocalizedString(licenseName),
        url: 'http://license.com/',
      },
    });
    render({ addon });

    expect(screen.getByText('License')).toBeInTheDocument();
    const link = screen.getByText(licenseName);
    expect(link).toHaveAttribute(
      'href',
      `/en-US/android/addon/${addon.slug}/license/`,
    );
  });

  it('renders a default name when the license name is null', () => {
    const url = 'some-url';
    _loadVersions({ license: { name: null, url } });
    render();

    expect(screen.getByText('License')).toBeInTheDocument();
    const link = screen.getByText('Custom License');
    expect(link).toHaveAttribute('href', url);
  });

  it('renders a default name when the license name and url are null', () => {
    _loadVersions({ license: { name: null, url: null } });
    render();

    expect(screen.getByText('License')).toBeInTheDocument();
    const licenseDd = screen.getByText('Custom License');
    expect(licenseDd).not.toHaveAttribute('href');
  });

  it('renders the license info without a link if the url is null', () => {
    _loadVersions({
      license: { name: createLocalizedString('justText'), url: null },
    });
    render();

    const licenseDd = screen.getByText('justText');
    expect(licenseDd).not.toHaveAttribute('href');
  });

  it('does not render any license info if the license is null', () => {
    _loadVersions({ license: null });
    render();

    expect(screen.queryByText('License')).not.toBeInTheDocument();
  });

  it('does not prefix a non-custom license link to point to AMO', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/3339
    const licenseName = 'some license';
    const url = 'www.license.com/';
    _loadVersions({
      license: {
        name: createLocalizedString(licenseName),
        url,
      },
    });
    render();

    expect(screen.getByText('License')).toBeInTheDocument();
    const link = screen.getByText(licenseName);
    // We don't expect lang or app to be prepended.
    expect(link).toHaveAttribute('href', url);
  });

  it('does not render a privacy policy if none exists', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      has_privacy_policy: false,
    });
    render({ addon });

    expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument();
  });

  it('renders the privacy policy and link', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      has_privacy_policy: true,
    });
    render({ addon });

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    const link = screen.getByText('Read the privacy policy for this add-on');
    expect(link).toHaveAttribute(
      'href',
      '/en-US/android/addon/chill-out/privacy/',
    );
  });

  it('does not render a EULA if none exists', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      has_eula: false,
    });
    render({ addon });

    expect(
      screen.queryByText('End-User License Agreement'),
    ).not.toBeInTheDocument();
  });

  it('renders the EULA and link', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, has_eula: true });
    render({ addon });

    expect(screen.getByText('End-User License Agreement')).toBeInTheDocument();
    const link = screen.getByText('Read the license agreement for this add-on');
    expect(link).toHaveAttribute(
      'href',
      '/en-US/android/addon/chill-out/eula/',
    );
  });

  it('does not link to stats if user is not author of the add-on', () => {
    const authorUserId = 11;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      slug: 'coolio',
      authors: [
        {
          ...fakeAddon.authors[0],
          id: authorUserId,
          name: 'tofumatt',
          picture_url: 'https://addons.mozilla.org/user-media/myphoto.jpg',
          url: 'https://addons.mozilla.org/en-GB/firefox/user/tofumatt/',
          username: 'tofumatt',
        },
      ],
    });
    render({
      addon,
      store: dispatchSignInActions({ userId: 5 }).store,
    });

    expect(screen.queryByText('Usage Statistics')).not.toBeInTheDocument();
  });

  it('links to stats if add-on author is viewing the page', () => {
    const authorUserId = 11;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      slug: 'coolio',
      authors: [
        {
          ...fakeAddon.authors[0],
          id: authorUserId,
          name: 'tofumatt',
          picture_url: 'https://addons.mozilla.org/user-media/myphoto.jpg',
          url: 'https://addons.mozilla.org/en-GB/firefox/user/tofumatt/',
          username: 'tofumatt',
        },
      ],
    });
    render({
      addon,
      store: dispatchSignInActions({ userId: authorUserId }).store,
    });

    expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
    const statsLink = screen.getByText('Visit stats dashboard');
    expect(statsLink).toHaveAttribute(
      'href',
      '/en-US/android/addon/coolio/statistics/',
    );
  });

  it('links to stats if user has STATS_VIEW permission', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    render({
      addon,
      store: dispatchSignInActions({
        userProps: { permissions: [STATS_VIEW] },
      }).store,
    });

    expect(screen.getByText('Visit stats dashboard')).toBeInTheDocument();
  });

  it.each([
    ADDON_TYPE_EXTENSION,
    ADDON_TYPE_DICT,
    ADDON_TYPE_LANG,
    ADDON_TYPE_STATIC_THEME,
  ])('links to version history if add-on is a %s', (type) => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type,
    });
    render({ addon });

    expect(screen.getByText('Version History')).toBeInTheDocument();
    const link = screen.getByText('See all versions');
    expect(link).toHaveAttribute(
      'href',
      `/en-US/android/addon/${addon.slug}/versions/`,
    );
  });

  it('shows tag links if addon tags defined', () => {
    const tagText = 'foo';
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      tags: [tagText],
    });
    render({ addon });

    expect(screen.getByText('Tags')).toBeInTheDocument();
    const link = screen.getByText(tagText);
    expect(link).toHaveAttribute('href', `/en-US/android/tag/${tagText}/`);
  });

  it("doesn't show tag section if addon.tags is empty list", () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, tags: [] });
    render({ addon });

    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  it('renders the last updated date', () => {
    const created = new Date();
    _loadVersions({
      file: {
        ...fakeFile,
        created,
      },
    });
    render();

    expect(screen.getByText('Last updated')).toBeInTheDocument();
    expect(screen.getByText(/^a few seconds ago/)).toBeInTheDocument();
  });

  it('does not show the last updated date if there is no last updated date', () => {
    render();

    expect(screen.queryByText('Last updated')).not.toBeInTheDocument();
  });

  it('renders admin links', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    dispatchSignInActions({ store, userProps: { permissions: [ADDONS_EDIT] } });
    render({ addon });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
  });

  it('renders author links', () => {
    const userId = 12345;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      authors: [
        {
          ...fakeAuthor,
          id: userId,
        },
      ],
    });
    dispatchSignInActions({ store, userId });
    render({ addon });

    expect(screen.getByText('Author Links')).toBeInTheDocument();
  });

  describe('related categories', () => {
    const categories = [
      {
        ...fakeCategory,
        application: CLIENT_APP_ANDROID,
        name: 'Alerts & Update',
        slug: 'alert-update',
        type: ADDON_TYPE_EXTENSION,
      },
      {
        ...fakeCategory,
        application: CLIENT_APP_ANDROID,
        name: 'Blogging',
        slug: 'blogging',
        type: ADDON_TYPE_EXTENSION,
      },
      {
        ...fakeCategory,
        application: CLIENT_APP_ANDROID,
        name: 'Games',
        slug: 'Games',
        type: ADDON_TYPE_EXTENSION,
      },
      {
        ...fakeCategory,
        application: CLIENT_APP_FIREFOX,
        name: 'Alerts & Update',
        slug: 'alert-update',
        type: ADDON_TYPE_EXTENSION,
      },
      {
        ...fakeCategory,
        application: CLIENT_APP_FIREFOX,
        name: 'Security',
        slug: 'security',
        type: ADDON_TYPE_EXTENSION,
      },
      {
        ...fakeCategory,
        application: CLIENT_APP_FIREFOX,
        name: 'Anime',
        slug: 'anime',
        type: ADDON_TYPE_STATIC_THEME,
      },
      {
        ...fakeCategory,
        application: CLIENT_APP_ANDROID,
        name: 'Alerts & Update',
        slug: 'alert-update',
        type: ADDON_TYPE_DICT,
      },
      {
        ...fakeCategory,
        application: CLIENT_APP_ANDROID,
        name: 'Alerts & Update',
        slug: 'alert-update',
        type: ADDON_TYPE_LANG,
      },
    ];

    it('renders related categories', () => {
      const { slug: slug1, name: name1 } = categories[3];
      const { slug: slug2, name: name2 } = categories[4];
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_FIREFOX]: [slug1, slug2] },
      });

      store.dispatch(loadCategories({ results: categories }));
      store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

      render({ addon, store });

      expect(screen.getByText('Related Categories')).toBeInTheDocument();
      expect(screen.getByText(name1)).toHaveAttribute(
        'href',
        `/en-US/firefox/extensions/category/${slug1}/`,
      );
      expect(screen.getByText(name2)).toHaveAttribute(
        'href',
        `/en-US/firefox/extensions/category/${slug2}/`,
      );
    });

    it('does not render related categories when add-on has no category', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_FIREFOX]: [] },
      });

      store.dispatch(loadCategories({ results: categories }));
      store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

      render({ addon, store });

      expect(screen.queryByText('Related Categories')).not.toBeInTheDocument();
    });

    it('does not render related categories when there are no loaded categories', () => {
      const { slug: slug1 } = categories[3];
      const { slug: slug2 } = categories[4];
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_FIREFOX]: [slug1, slug2] },
      });

      store.dispatch(loadCategories({ results: [] }));
      store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

      render({ addon, store });

      expect(screen.queryByText('Related Categories')).not.toBeInTheDocument();
    });

    it('does not render related categories when categories for add-on do not exist in clientApp', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: {
          // 'blogging' and 'games' only exist for CLIENT_APP_ANDROID
          [CLIENT_APP_FIREFOX]: ['blogging', 'games'],
        },
      });

      store.dispatch(loadCategories({ results: categories }));
      store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

      render({ addon, store });

      expect(screen.queryByText('Related Categories')).not.toBeInTheDocument();
    });

    it('does not render a related category if add-on does not have that category', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_ANDROID]: ['does-not-exist'] },
      });

      store.dispatch(loadCategories({ results: categories }));

      render({ addon, store });

      expect(screen.queryByText('Related Categories')).not.toBeInTheDocument();
    });

    it('does not render a related category if add-on does not have any category at all', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: {},
      });
      store.dispatch(loadCategories({ results: categories }));

      render({ addon, store });

      expect(screen.queryByText('Related Categories')).not.toBeInTheDocument();
    });

    it('does not render a related category when add-on type does not have this category', () => {
      const { slug } = categories[0];
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_ANDROID]: [slug] },
        type: ADDON_TYPE_STATIC_THEME,
      });

      store.dispatch(loadCategories({ results: categories }));

      render({ addon, store });

      expect(screen.queryByText('Related Categories')).not.toBeInTheDocument();
    });

    it.each([ADDON_TYPE_DICT, ADDON_TYPE_LANG])(
      'does not render related categories for addonType=%s',
      (type) => {
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          categories: { [CLIENT_APP_ANDROID]: [categories[0].slug] },
          type,
        });
        store.dispatch(loadCategories({ results: categories }));

        render({ addon, store });

        expect(
          screen.queryByText('Related Categories'),
        ).not.toBeInTheDocument();
      },
    );

    it('renders errors when API error occurs', () => {
      const errorHandler = new ErrorHandler({
        id: 'some-error-handler-id',
        dispatch: store.dispatch,
      });
      const message = 'Some error message';

      errorHandler.handle(
        createApiError({
          response: { status: 404 },
          apiURL: 'https://some/api/endpoint',
          jsonResponse: { message },
        }),
      );

      render({ errorHandler });

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('UTM parameters', () => {
    const authorUserId = 11;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      has_privacy_policy: true,
      has_eula: true,
      authors: [
        {
          ...fakeAddon.authors[0],
          id: authorUserId,
          name: 'tofumatt',
          picture_url: 'https://addons.mozilla.org/user-media/myphoto.jpg',
          url: 'https://addons.mozilla.org/en-GB/firefox/user/tofumatt/',
          username: 'tofumatt',
        },
      ],
    });

    beforeEach(() => {
      store = dispatchSignInActions({ userId: authorUserId }).store;

      _loadVersions({
        license: {
          is_custom: true,
          name: createLocalizedString('tofulicense'),
          url: 'www.license.com',
        },
      });
    });

    it('renders links with UTM query params when there are some', () => {
      const utmMedium = 'referral';

      render({
        addon,
        location: `/some/path/?utm_medium=${utmMedium}`,
      });

      const expectedQueryString = `utm_medium=${utmMedium}`;
      expect(screen.getByText('Visit stats dashboard')).toHaveAttribute(
        'href',
        `/en-US/android/addon/${addon.slug}/statistics/?${expectedQueryString}`,
      );
      expect(screen.getByText('tofulicense')).toHaveAttribute(
        'href',
        `/en-US/android/addon/${addon.slug}/license/?${expectedQueryString}`,
      );
      expect(
        screen.getByText('Read the privacy policy for this add-on'),
      ).toHaveAttribute(
        'href',
        `/en-US/android/addon/${addon.slug}/privacy/?${expectedQueryString}`,
      );
      expect(
        screen.getByText('Read the license agreement for this add-on'),
      ).toHaveAttribute(
        'href',
        `/en-US/android/addon/${addon.slug}/eula/?${expectedQueryString}`,
      );
      expect(screen.getByText('See all versions')).toHaveAttribute(
        'href',
        `/en-US/android/addon/${addon.slug}/versions/?${expectedQueryString}`,
      );
    });
  });
});
