import * as React from 'react';

import AddonAdminLinks from 'amo/components/AddonAdminLinks';
import AddonAuthorLinks from 'amo/components/AddonAuthorLinks';
import AddonMoreInfo, { AddonMoreInfoBase } from 'amo/components/AddonMoreInfo';
import Link from 'amo/components/Link';
import { loadVersions } from 'amo/reducers/versions';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  STATS_VIEW,
} from 'amo/constants';
import { formatFilesize } from 'amo/i18n/utils';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  createInternalAddonWithLang,
  createLocalizedString,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  fakePlatformFile,
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
    return shallowUntilTarget(
      <AddonMoreInfo
        addon={props.addon || createInternalAddonWithLang(fakeAddon)}
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
          ...fakePlatformFile,
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

  it('renders the last updated date', () => {
    const created = new Date();
    _loadVersions({
      files: [
        {
          ...fakePlatformFile,
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
