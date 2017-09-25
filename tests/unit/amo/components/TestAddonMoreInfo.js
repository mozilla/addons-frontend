import { oneLine } from 'common-tags';
import deepcopy from 'deepcopy';
import React from 'react';

import AddonMoreInfo, {
  AddonMoreInfoBase,
} from 'amo/components/AddonMoreInfo';
import { createInternalAddon } from 'core/reducers/addons';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst, shallowUntilTarget } from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';


describe(__filename, () => {
  const { store } = dispatchClientMetadata();

  function render(props) {
    return shallowUntilTarget(
      <AddonMoreInfo
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={getFakeI18nInst()}
        store={store}
        {...props}
      />,
      AddonMoreInfoBase
    );
  }

  it('renders LoadingText if no add-on is present', () => {
    const root = render({ addon: null });

    expect(root.find(LoadingText)).toHaveLength(4);
  });

  it('does renders a link <dt> if links exist', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      homepage: null,
      support_url: 'foo.com',
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-links-title'))
      .toIncludeText('Add-on Links');
  });

  it('does not render a link <dt> if no links exist', () => {
    const partialAddon = deepcopy(fakeAddon);
    delete partialAddon.homepage;
    delete partialAddon.support_url;
    const root = render({ addon: createInternalAddon(partialAddon) });

    expect(root.find('.AddonMoreInfo-links-title')).toHaveLength(0);
  });

  it('does not render a homepage if none exists', () => {
    const partialAddon = deepcopy(fakeAddon);
    delete partialAddon.homepage;
    const root = render({ addon: createInternalAddon(partialAddon) });

    expect(root.find('.AddonMoreInfo-homepage-link')).toHaveLength(0);
  });

  it('renders the homepage of an add-on', () => {
    const addon = createInternalAddon({
      ...fakeAddon, homepage: 'http://hamsterdance.com/',
    });
    const root = render({ addon });
    const link = root.find('.AddonMoreInfo-homepage-link');

    expect(link).toIncludeText('Homepage');
    expect(link).toHaveProp('href', 'http://hamsterdance.com/');
  });

  it('does not render a support link if none exists', () => {
    const partialAddon = deepcopy(fakeAddon);
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

  it('renders the version number of an add-on', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        version: '2.0.1',
      },
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-version')).toHaveText('2.0.1');
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

    expect(root.find('.AddonMoreInfo-license-title')).toHaveText('License');
    expect(root.find('.AddonMoreInfo-license-link'))
      .toHaveText('tofulicense');
    expect(root.find('.AddonMoreInfo-license-link'))
      .toHaveProp('href', 'http://license.com/');
  });

  it('does not render a privacy policy if none exists', () => {
    const addon = createInternalAddon({
      ...fakeAddon, has_privacy_policy: false,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-privacy-policy-title'))
      .toHaveLength(0);
    expect(root.find('.AddonMoreInfo-privacy-policy-link'))
      .toHaveLength(0);
  });

  it('renders the privacy policy and link', () => {
    const addon = createInternalAddon({
      ...fakeAddon, has_privacy_policy: true,
    });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-privacy-policy-title'))
      .toHaveText('Privacy Policy');
    expect(root.find('.AddonMoreInfo-privacy-policy-link').children())
      .toHaveText('Read the privacy policy for this add-on');
    expect(root.find('.AddonMoreInfo-privacy-policy-link'))
      .toHaveProp('href', '/addon/chill-out/privacy/');
  });

  it('does not render a EULA if none exists', () => {
    const addon = createInternalAddon({ ...fakeAddon, has_eula: false });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-eula-title')).toHaveLength(0);
    expect(root.find('.AddonMoreInfo-eula-link')).toHaveLength(0);
  });

  it('renders the EULA and link', () => {
    const addon = createInternalAddon({ ...fakeAddon, has_eula: true });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-eula-title'))
      .toHaveText('End-User License Agreement');
    expect(root.find('.AddonMoreInfo-eula-link').children())
      .toHaveText('Read the license agreement for this add-on');
    expect(root.find('.AddonMoreInfo-eula-link'))
      .toHaveProp('href', '/addon/chill-out/eula/');
  });

  it('renders the ID and title attribute', () => {
    const addon = createInternalAddon({ ...fakeAddon, id: 9001 });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-database-id-title'))
      .toHaveText('Site Identifier');
    expect(root.find('.AddonMoreInfo-database-id-title'))
      .toHaveProp('title', oneLine`This ID is useful for debugging and
        identifying your add-on to site administrators.`);
    expect(root.find('.AddonMoreInfo-database-id-content'))
      .toHaveText('9001');
  });

  it('links to version history', () => {
    const addon = createInternalAddon({ ...fakeAddon, slug: 'some-slug' });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-version-history-title'))
      .toHaveLength(1);
    const link = root.find('.AddonMoreInfo-version-history-link');
    expect(link).toHaveProp('href', `/addon/${addon.slug}/versions/`);
  });

  it('links to development channel versions', () => {
    const addon = createInternalAddon({ ...fakeAddon, slug: 'some-slug' });
    const root = render({ addon });

    expect(root.find('.AddonMoreInfo-beta-versions-title'))
      .toHaveLength(1);
    const link = root.find('.AddonMoreInfo-beta-versions-link');
    expect(link).toHaveProp('href', `/addon/${addon.slug}/versions/beta`);
  });
});
