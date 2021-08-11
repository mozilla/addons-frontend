import * as React from 'react';

import { createApiError } from 'amo/api';
import AddonAdminLinks from 'amo/components/AddonAdminLinks';
import AddonAuthorLinks from 'amo/components/AddonAuthorLinks';
import AddonMoreInfo, { AddonMoreInfoBase } from 'amo/components/AddonMoreInfo';
import ErrorList from 'amo/components/ErrorList';
import Link from 'amo/components/Link';
import { ErrorHandler } from 'amo/errorHandler';
import { setClientApp } from 'amo/reducers/api';
import { loadCategories } from 'amo/reducers/categories';
import { loadVersions } from 'amo/reducers/versions';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  STATS_VIEW,
} from 'amo/constants';
import { formatFilesize } from 'amo/i18n/utils';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  createInternalAddonWithLang,
  createLocalizedString,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeCategory,
  fakeI18n,
  fakeFile,
  fakeTheme,
  fakeVersion,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import LoadingText from 'amo/components/LoadingText';

describe(__filename, () => {
  let store;
  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render({ location, ...props } = {}) {
    const errorHandler = createStubErrorHandler();

    return shallowUntilTarget(
      <AddonMoreInfo
        addon={props.addon || createInternalAddonWithLang(fakeAddon)}
        errorHandler={errorHandler}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      AddonMoreInfoBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  }

  it('renders LoadingText if no add-on is present', () => {
    const root = render({ addon: null });

    // These fields will be visible during loading since
    // they will always exist for the loaded add-on.
    expect(root.find('.AddonMoreInfo-last-updated')).toHaveLength(1);

    expect(root.find(LoadingText)).toHaveLength(1);

    // These fields will not be visible during loading
    // since they may not exist.
    expect(root.find('.AddonMoreInfo-links')).toHaveLength(0);
    expect(root.find('.AddonMoreInfo-license')).toHaveLength(0);
    expect(root.find('.AddonMoreInfo-privacy-policy')).toHaveLength(0);
    expect(root.find('.AddonMoreInfo-version')).toHaveLength(0);
    expect(root.find('.AddonMoreInfo-version-history')).toHaveLength(0);
    expect(root.find('.AddonMoreInfo-eula')).toHaveLength(0);
  });

  it('renders a link <dt> if links exist', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: null,
      support_url: {
        url: createLocalizedString('foo.com'),
        outgoing: createLocalizedString('baa.com'),
      },
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-links')).toHaveProp(
      'term',
      'Add-on Links',
    );
  });

  it('renders a link <dt> if support email exists', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: null,
      support_url: null,
      support_email: createLocalizedString('hello@foo.com'),
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-links')).toHaveProp(
      'term',
      'Add-on Links',
    );
  });

  it('does not render a link <dt> if no links exist', () => {
    const partialAddon = createInternalAddonWithLang(fakeAddon);
    delete partialAddon.homepage;
    delete partialAddon.support_email;
    delete partialAddon.support_url;
    const root = render({ addon: partialAddon });

    expect(root.find('.AddonMoreInfo-links')).toHaveLength(0);
  });

  it('does not render a homepage if none exists', () => {
    const partialAddon = createInternalAddonWithLang(fakeAddon);
    delete partialAddon.homepage;
    const root = render({ addon: partialAddon });

    expect(root.find('.AddonMoreInfo-homepage')).toHaveLength(0);
  });

  it('does not render a link <dt> if support email is not valid', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: null,
      support_url: null,
      support_email: createLocalizedString('invalid-email'),
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-links')).toHaveLength(0);
  });

  it('renders the homepage of an add-on', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      homepage: {
        url: createLocalizedString('http://hamsterdance.com/'),
        outgoing: createLocalizedString('https://outgoing.mozilla.org/hamster'),
      },
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-homepage-link');

    expect(link).toIncludeText('Homepage');
    expect(link).toHaveProp('href', 'https://outgoing.mozilla.org/hamster');
    expect(link).toHaveProp('title', 'http://hamsterdance.com/');
  });

  it('does not render a support link if none exists', () => {
    const partialAddon = createInternalAddonWithLang(fakeAddon);
    delete partialAddon.support_url;
    const root = render({ addon: partialAddon });

    expect(root.find('.AddonMoreInfo-support-link')).toHaveLength(0);
  });

  it('renders the support link of an add-on', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      support_url: {
        url: createLocalizedString('http://support.hamsterdance.com/'),
        outgoing: createLocalizedString('https://outgoing.mozilla.org/hamster'),
      },
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-support-link');

    expect(link).toIncludeText('Support site');
    expect(link).toHaveProp('href', 'https://outgoing.mozilla.org/hamster');
    expect(link).toHaveProp('title', 'http://support.hamsterdance.com/');
  });

  it('renders the email link of an add-on', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      support_email: createLocalizedString('ba@bar.com'),
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-support-email');

    expect(link).toIncludeText('Support Email');
    expect(link).toHaveProp('href', 'mailto:ba@bar.com');
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
    const root = render();

    expect(root.find('.AddonMoreInfo-version').children()).toHaveText('2.0.1');
  });

  it('renders file size of an add-on', () => {
    const size = 10;
    _loadVersions({
      files: [
        {
          ...fakeFile,
          size,
        },
      ],
    });
    const root = render();

    expect(root.find('.AddonMoreInfo-filesize').children()).toHaveText(
      formatFilesize({ size, i18n: fakeI18n() }),
    );
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
    const root = render();
    const link = root.find('.AddonMoreInfo-license-link');

    expect(root.find('.AddonMoreInfo-license')).toHaveProp('term', 'License');
    expect(link.children()).toIncludeText(licenseName);
    expect(link).toHaveProp('href', licenseUrl);
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

    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-license-link');

    expect(root.find('.AddonMoreInfo-license')).toHaveProp('term', 'License');
    expect(link.children()).toIncludeText(licenseName);
    expect(link).toHaveProp('to', `/addon/${addon.slug}/license/`);
  });

  it('renders a default name when the license name is null', () => {
    _loadVersions({ license: { name: null, url: 'some-url' } });

    const root = render();

    const license = root.find('.AddonMoreInfo-license-link');
    expect(license).toHaveLength(1);
    expect(license.children()).toIncludeText('Custom License');
  });

  it('renders a default name when the license name and url are null', () => {
    _loadVersions({ license: { name: null, url: null } });

    const root = render();

    const license = root.find('.AddonMoreInfo-license-name');
    expect(license).toHaveLength(1);
    expect(license.children()).toIncludeText('Custom License');
    expect(root.find('.AddonMoreInfo-license-link')).toHaveLength(0);
  });

  it('renders the license info without a link if the url is null', () => {
    _loadVersions({
      license: { name: createLocalizedString('justText'), url: null },
    });
    const root = render();
    expect(root.find('.AddonMoreInfo-license-link')).toHaveLength(0);

    const link = root.find('.AddonMoreInfo-license-name');
    expect(link.children()).toIncludeText('justText');
  });

  it('does not render any license info if the license is null', () => {
    _loadVersions({ license: null });
    const root = render();
    expect(root.find('.AddonMoreInfo-license')).toHaveLength(0);
  });

  it('does not prefix a non-custom license link to point to AMO', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/3339
    _loadVersions({
      license: { name: 'tofulicense', url: 'www.license.com/' },
    });
    const root = render();
    const link = root.find('.AddonMoreInfo-license-link');

    expect(link).toHaveProp('prependClientApp', false);
    expect(link).toHaveProp('prependLang', false);
  });

  it('does not render a privacy policy if none exists', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      has_privacy_policy: false,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-privacy-policy')).toHaveLength(0);
  });

  it('renders the privacy policy and link', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      has_privacy_policy: true,
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-privacy-policy').find(Link);

    expect(root.find('.AddonMoreInfo-privacy-policy')).toHaveProp(
      'term',
      'Privacy Policy',
    );
    expect(link.children()).toHaveText(
      'Read the privacy policy for this add-on',
    );
    expect(link).toHaveProp('to', '/addon/chill-out/privacy/');
  });

  it('does not render a EULA if none exists', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      has_eula: false,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-eula')).toHaveLength(0);
  });

  it('renders the EULA and link', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, has_eula: true });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-eula')).toHaveProp(
      'term',
      'End-User License Agreement',
    );
    expect(root.find('.AddonMoreInfo-eula').find(Link).children()).toHaveText(
      'Read the license agreement for this add-on',
    );
    expect(root.find('.AddonMoreInfo-eula').find(Link)).toHaveProp(
      'to',
      '/addon/chill-out/eula/',
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
          picture_url: 'http://cdn.a.m.o/myphoto.jpg',
          url: 'http://a.m.o/en-GB/firefox/user/tofumatt/',
          username: 'tofumatt',
        },
      ],
    });
    const root = render({
      addon,
      store: dispatchSignInActions({ userId: 5 }).store,
    });

    const statsLink = root.find('.AddonMoreInfo-stats-link');
    expect(statsLink).toHaveLength(0);
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
          picture_url: 'http://cdn.a.m.o/myphoto.jpg',
          url: 'http://a.m.o/en-GB/firefox/user/tofumatt/',
          username: 'tofumatt',
        },
      ],
    });
    const root = render({
      addon,
      store: dispatchSignInActions({ userId: authorUserId }).store,
    });

    const statsLink = root.find('.AddonMoreInfo-stats-link');
    expect(statsLink).toHaveLength(1);
    expect(statsLink.children()).toHaveText('Visit stats dashboard');
    expect(statsLink).toHaveProp('href', '/addon/coolio/statistics/');
  });

  it('links to stats if user has STATS_VIEW permission', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const root = render({
      addon,
      store: dispatchSignInActions({
        userProps: { permissions: [STATS_VIEW] },
      }).store,
    });

    const statsLink = root.find('.AddonMoreInfo-stats-link');
    expect(statsLink).toHaveLength(1);
  });

  it('links to version history if add-on is extension', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_EXTENSION,
    });

    const root = render({ addon });
    const history = root.find('.AddonMoreInfo-version-history');

    expect(history).toHaveProp('term', 'Version History');
    expect(history.find(Link)).toHaveProp(
      'to',
      `/addon/${addon.slug}/versions/`,
    );
  });

  it('links to version history if add-on is a dictionary', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_DICT,
    });

    const root = render({ addon });
    const history = root.find('.AddonMoreInfo-version-history');

    expect(history).toHaveProp('term', 'Version History');
    expect(history.find(Link)).toHaveProp(
      'to',
      `/addon/${addon.slug}/versions/`,
    );
  });

  it('links to version history if add-on is a language pack', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_LANG,
    });

    const root = render({ addon });
    const history = root.find('.AddonMoreInfo-version-history');

    expect(history).toHaveProp('term', 'Version History');
    expect(history.find(Link)).toHaveProp(
      'to',
      `/addon/${addon.slug}/versions/`,
    );
  });

  it('links to version history if add-on is a theme', () => {
    const addon = createInternalAddonWithLang({ ...fakeTheme });

    const root = render({ addon });
    const history = root.find('.AddonMoreInfo-version-history');

    expect(history).toHaveProp('term', 'Version History');
    expect(history.find(Link)).toHaveProp(
      'to',
      `/addon/${addon.slug}/versions/`,
    );
  });

  it('shows tag links if addon tags defined', () => {
    const tagText = 'foo';
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      tags: [tagText],
    });

    const root = render({ addon });
    const tagsLinks = root.find('.AddonMoreInfo-tag-links');

    expect(tagsLinks).toHaveProp('term', 'Tags');
    expect(tagsLinks.find(Link)).toHaveLength(addon.tags.length);
    expect(tagsLinks.find(Link)).toHaveProp('to', `/tag/${tagText}/`);
    expect(tagsLinks.find(Link).children()).toHaveText(tagText);
  });

  it("doesn't show tag section if addon.tags is empty list", () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, tags: [] });

    const root = render({ addon });
    const tagsLinks = root.find('.AddonMoreInfo-tag-links');

    expect(tagsLinks).toHaveLength(0);
  });

  it('renders the last updated date', () => {
    const created = new Date();
    _loadVersions({
      files: [
        {
          ...fakeFile,
          created,
        },
      ],
    });
    const root = render();

    expect(root.find('.AddonMoreInfo-last-updated')).toHaveLength(1);
    expect(root.find('.AddonMoreInfo-last-updated').children()).toIncludeText(
      'a few seconds ago',
    );
  });

  it('does not show the last updated date if there is no last updated date', () => {
    const root = render();

    expect(root.find('.AddonMoreInfo-last-updated')).toHaveLength(0);
  });

  it('renders admin links', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const root = render({ addon });

    expect(root.find(AddonAdminLinks)).toHaveProp('addon', addon);
  });

  it('renders author links', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const root = render({ addon });

    expect(root.find(AddonAuthorLinks)).toHaveProp('addon', addon);
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
      const { slug: slug1 } = categories[3];
      const { slug: slug2 } = categories[4];
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_FIREFOX]: [slug1, slug2] },
      });

      store.dispatch(loadCategories({ results: categories }));
      store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

      const root = render({ addon, store });

      expect(
        root.find('.AddonMoreInfo-related-categories').find(Link),
      ).toHaveLength(2);
      expect(
        root
          .find('.AddonMoreInfo-related-categories')
          .find(Link)
          .at(0)
          .prop('to'),
      ).toEqual(`/extensions/category/${slug1}/`);
      expect(
        root
          .find('.AddonMoreInfo-related-categories')
          .find(Link)
          .at(1)
          .prop('to'),
      ).toEqual(`/extensions/category/${slug2}/`);
    });

    it('does not render related categories when add-on has no category', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_FIREFOX]: [] },
      });

      store.dispatch(loadCategories({ results: categories }));
      store.dispatch(setClientApp(CLIENT_APP_FIREFOX));

      const root = render({ addon, store });

      expect(
        root.find('.AddonMoreInfo-related-categories').find(Link),
      ).toHaveLength(0);
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

      const root = render({ addon, store });

      expect(
        root.find('.AddonMoreInfo-related-categories').find(Link),
      ).toHaveLength(0);
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

      const root = render({ addon, store });

      expect(
        root.find('.AddonMoreInfo-related-categories').find(Link),
      ).toHaveLength(0);
    });

    it('does not render a related category if add-on does not have that category', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_ANDROID]: ['does-not-exist'] },
      });

      store.dispatch(loadCategories({ results: categories }));

      const root = render({ addon, store });

      expect(
        root.find('.AddonMoreInfo-related-categories').find(Link),
      ).toHaveLength(0);
    });

    it('does not render a related category if add-on does not have any category at all', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: {},
      });
      store.dispatch(loadCategories({ results: categories }));

      const root = render({ addon, store });

      expect(
        root.find('.AddonMoreInfo-related-categories').find(Link),
      ).toHaveLength(0);
    });

    it('does not render a related category when add-on type does not have this category', () => {
      const { slug } = categories[0];
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        categories: { [CLIENT_APP_ANDROID]: [slug] },
        type: ADDON_TYPE_STATIC_THEME,
      });

      store.dispatch(loadCategories({ results: categories }));

      const root = render({ addon, store });

      expect(
        root.find('.AddonMoreInfo-related-categories').find(Link),
      ).toHaveLength(0);
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

        const root = render({ addon, store });

        expect(
          root.find('.AddonMoreInfo-related-categories').find(Link),
        ).toHaveLength(0);
      },
    );

    it('renders errors when API error occurs', () => {
      const errorHandler = new ErrorHandler({
        id: 'some-error-handler-id',
        dispatch: store.dispatch,
      });

      errorHandler.handle(
        createApiError({
          response: { status: 404 },
          apiURL: 'https://some/api/endpoint',
          jsonResponse: { message: 'not found' },
        }),
      );

      const root = render({ errorHandler });

      expect(root.find(ErrorList)).toHaveLength(1);
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
          picture_url: 'http://cdn.a.m.o/myphoto.jpg',
          url: 'http://a.m.o/en-GB/firefox/user/tofumatt/',
          username: 'tofumatt',
        },
      ],
    });

    beforeEach(() => {
      store = dispatchSignInActions({ userId: authorUserId }).store;

      _loadVersions({
        license: {
          is_custom: true,
          name: 'tofulicense',
          url: 'www.license.com',
        },
      });
    });

    it('renders links with UTM query params when there are some', () => {
      const utm_medium = 'referral';

      const root = render({
        addon,
        location: createFakeLocation({ query: { utm_medium } }),
      });

      const expectedQueryString = `utm_medium=${utm_medium}`;
      expect(root.find('.AddonMoreInfo-stats-link')).toHaveProp(
        'href',
        `/addon/${addon.slug}/statistics/?${expectedQueryString}`,
      );
      expect(root.find('.AddonMoreInfo-license-link')).toHaveProp(
        'to',
        `/addon/${addon.slug}/license/?${expectedQueryString}`,
      );
      expect(root.find('.AddonMoreInfo-privacy-policy').find(Link)).toHaveProp(
        'to',
        `/addon/${addon.slug}/privacy/?${expectedQueryString}`,
      );
      expect(root.find('.AddonMoreInfo-eula').find(Link)).toHaveProp(
        'to',
        `/addon/${addon.slug}/eula/?${expectedQueryString}`,
      );
      expect(
        root.find('.AddonMoreInfo-version-history-link').find(Link),
      ).toHaveProp(
        'to',
        `/addon/${addon.slug}/versions/?${expectedQueryString}`,
      );
    });
  });
});
