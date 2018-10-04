import * as React from 'react';

import AddonAdminLinks from 'amo/components/AddonAdminLinks';
import AddonMoreInfo, { AddonMoreInfoBase } from 'amo/components/AddonMoreInfo';
import Link from 'amo/components/Link';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  STATS_VIEW,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  const { store } = dispatchClientMetadata();

  function render(props) {
    return shallowUntilTarget(
      <AddonMoreInfo
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      AddonMoreInfoBase,
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
    const addon = createInternalAddon({
      ...fakeAddon,
      homepage: null,
      support_url: 'foo.com',
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-links')).toHaveProp(
      'term',
      'Add-on Links',
    );
  });

  it('renders a link <dt> if support email exists', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      homepage: null,
      support_url: null,
      support_email: 'hello@foo.com',
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-links')).toHaveProp(
      'term',
      'Add-on Links',
    );
  });

  it('does not render a link <dt> if no links exist', () => {
    const partialAddon = createInternalAddon(fakeAddon);
    delete partialAddon.homepage;
    delete partialAddon.support_email;
    delete partialAddon.support_url;
    const root = render({ addon: createInternalAddon(partialAddon) });

    expect(root.find('.AddonMoreInfo-links')).toHaveLength(0);
  });

  it('does not render a homepage if none exists', () => {
    const partialAddon = createInternalAddon(fakeAddon);
    delete partialAddon.homepage;
    const root = render({ addon: createInternalAddon(partialAddon) });

    expect(root.find('.AddonMoreInfo-homepage')).toHaveLength(0);
  });

  it('does not render a link <dt> if support email is not valid', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      homepage: null,
      support_url: null,
      support_email: 'invalid-email',
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-links')).toHaveLength(0);
  });

  it('renders the homepage of an add-on', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      homepage: 'http://hamsterdance.com/',
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-homepage-link');

    expect(link).toIncludeText('Homepage');
    expect(link).toHaveProp('href', 'http://hamsterdance.com/');
  });

  it('does not render a support link if none exists', () => {
    const partialAddon = createInternalAddon(fakeAddon);
    delete partialAddon.support_url;
    const root = render({ addon: createInternalAddon(partialAddon) });

    expect(root.find('.AddonMoreInfo-support-link')).toHaveLength(0);
  });

  it('renders the support link of an add-on', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      support_url: 'http://support.hampsterdance.com/',
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-support-link');

    expect(link).toIncludeText('Support Site');
    expect(link).toHaveProp('href', 'http://support.hampsterdance.com/');
  });

  it('renders the email link of an add-on', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      support_email: 'ba@bar.com',
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-support-email');

    expect(link).toIncludeText('Support Email');
    expect(link).toHaveProp('href', 'mailto:ba@bar.com');
  });

  it('renders the version number of an add-on', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        version: '2.0.1',
      },
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-version').children()).toHaveText('2.0.1');
  });

  it('renders the license and link', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        license: { name: 'tofulicense', url: 'http://license.com/' },
      },
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-license-link');

    expect(root.find('.AddonMoreInfo-license')).toHaveProp('term', 'License');
    expect(link.children()).toIncludeText('tofulicense');
    expect(link).toHaveProp('href', 'http://license.com/');
  });

  it('renders the license info without a link if the url is null', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        license: { name: 'justText', url: null },
      },
    });
    const root = render({ addon });
    expect(root.find('.AddonMoreInfo-license-link')).toHaveLength(0);

    const link = root.find('.AddonMoreInfo-license-name');
    expect(link.children()).toIncludeText('justText');
  });

  it('does not render any license info if the license is null', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        license: null,
      },
    });
    const root = render({ addon });
    expect(root.find('.AddonMoreInfo-license')).toHaveLength(0);
  });

  it('does not prefix a license link with the add-ons URL', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/3339
    const addon = createInternalAddon({
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        license: { name: 'tofulicense', url: 'www.license.com/' },
      },
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-license-link');

    expect(link).toHaveProp('prependClientApp', false);
    expect(link).toHaveProp('prependLang', false);
  });

  it('does not render a privacy policy if none exists', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      has_privacy_policy: false,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-privacy-policy')).toHaveLength(0);
  });

  it('renders the privacy policy and link', () => {
    const addon = createInternalAddon({
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
    expect(link).toHaveProp('href', '/addon/chill-out/privacy/');
  });

  it('does not render a EULA if none exists', () => {
    const addon = createInternalAddon({ ...fakeAddon, has_eula: false });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-eula')).toHaveLength(0);
  });

  it('renders the EULA and link', () => {
    const addon = createInternalAddon({ ...fakeAddon, has_eula: true });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-eula')).toHaveProp(
      'term',
      'End-User License Agreement',
    );
    expect(
      root
        .find('.AddonMoreInfo-eula')
        .find(Link)
        .children(),
    ).toHaveText('Read the license agreement for this add-on');
    expect(root.find('.AddonMoreInfo-eula').find(Link)).toHaveProp(
      'href',
      '/addon/chill-out/eula/',
    );
  });

  it('does not link to stats if user is not author of the add-on', () => {
    const authorUserId = 11;
    const addon = createInternalAddon({
      ...fakeAddon,
      slug: 'coolio',
      public_stats: false,
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

  it('links to stats if add-on public_stats is true', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      public_stats: true,
    });
    const root = render({
      addon,
      // Make sure no user is signed in.
      store: dispatchClientMetadata().store,
    });

    const statsLink = root.find('.AddonMoreInfo-stats-link');
    expect(statsLink).toHaveLength(1);
  });

  it('links to stats if add-on author is viewing the page', () => {
    const authorUserId = 11;
    const addon = createInternalAddon({
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
    const addon = createInternalAddon({
      ...fakeAddon,
      public_stats: false,
    });
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
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_EXTENSION,
    });

    const root = render({ addon });
    const history = root.find('.AddonMoreInfo-version-history');

    expect(history).toHaveProp('term', 'Version History');
    expect(history.find(Link)).toHaveProp(
      'href',
      `/addon/${addon.slug}/versions/`,
    );
  });

  it('links to version history if add-on is a dictionary', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_DICT,
    });

    const root = render({ addon });
    const history = root.find('.AddonMoreInfo-version-history');

    expect(history).toHaveProp('term', 'Version History');
    expect(history.find(Link)).toHaveProp(
      'href',
      `/addon/${addon.slug}/versions/`,
    );
  });

  it('links to version history if add-on is a language pack', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_LANG,
    });

    const root = render({ addon });
    const history = root.find('.AddonMoreInfo-version-history');

    expect(history).toHaveProp('term', 'Version History');
    expect(history.find(Link)).toHaveProp(
      'href',
      `/addon/${addon.slug}/versions/`,
    );
  });

  it('omits version history for search plugins', () => {
    // Search plugins only have one listed version so showing their
    // version history is useless–we just omit it.
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_OPENSEARCH,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-version-history')).toHaveLength(0);
  });

  it('omits version history for search tool', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_OPENSEARCH,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-version-history')).toHaveLength(0);
  });

  it('omits version history for themes', () => {
    const addon = createInternalAddon({ ...fakeTheme });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-version-history')).toHaveLength(0);
  });

  it('renders the last updated date', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      last_updated: Date.now(),
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-last-updated')).toHaveLength(1);
    expect(root.find('.AddonMoreInfo-last-updated').children()).toIncludeText(
      'a few seconds ago',
    );
  });

  it('does not show the last updated date if there is no last updated date', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      last_updated: null,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-last-updated')).toHaveLength(0);
  });

  it('renders admin links', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find(AddonAdminLinks)).toHaveProp('addon', addon);
  });
});
