import * as React from 'react';

import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonInstallError from 'amo/components/AddonInstallError';
import AddonVersionCard, {
  AddonVersionCardBase,
} from 'amo/components/AddonVersionCard';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import InstallWarning from 'amo/components/InstallWarning';
import Link from 'amo/components/Link';
import { setInstallError, setInstallState } from 'amo/reducers/installations';
import { FATAL_ERROR, INSTALLING } from 'amo/constants';
import { formatFilesize } from 'amo/i18n/utils';
import { loadVersions } from 'amo/reducers/versions';
import {
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakePlatformFile,
  fakeVersion,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import LoadingText from 'amo/components/LoadingText';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return shallowUntilTarget(
      <AddonVersionCard
        addon={createInternalAddonWithLang(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        version={createInternalVersionWithLang(fakeAddon.current_version)}
        {...props}
      />,
      AddonVersionCardBase,
    );
  };

  const _loadVersions = ({ addon = fakeAddon } = {}) => {
    store.dispatch(
      loadVersions({
        slug: addon.slug,
        versions: [
          {
            ...addon.current_version,
          },
        ],
      }),
    );
  };

  it('returns a card with a message if version is null', () => {
    const headerText = 'some header text';
    const root = render({
      headerText,
      version: null,
    });

    expect(root.find('.AddonVersionCard-header')).toHaveText(headerText);
    expect(root.find('.AddonVersionCard-noVersion')).toHaveText(
      'No version found',
    );
  });

  it('returns a card with LoadingText if version is undefined', () => {
    const root = render({
      version: undefined,
    });

    expect(root.find(LoadingText)).toHaveLength(3);
  });

  it('renders a header if headerText is provided', () => {
    const headerText = 'some header text';
    const root = render({ headerText });

    expect(root.find('.AddonVersionCard-header')).toHaveText(headerText);
  });

  it('does not render a header if no headerText is provided', () => {
    const root = render({ headerText: null });

    expect(root.find('.AddonVersionCard-header')).toHaveLength(0);
  });

  it('renders a version number', () => {
    const versionNumber = '1.0';
    const root = render({
      version: createInternalVersionWithLang({
        ...fakeVersion,
        version: versionNumber,
      }),
    });

    expect(root.find('.AddonVersionCard-version')).toHaveText(
      `Version ${versionNumber}`,
    );
  });

  it('renders a compatibility string', () => {
    const app = 'testApp';
    const max = '2.0';
    const min = '1.0';
    const version = {
      ...fakeVersion,
      compatibility: {
        [app]: {
          min,
          max,
        },
      },
    };

    const addon = { ...fakeAddon, current_version: version };
    _loadVersions({ addon });

    const root = render({
      version: createInternalVersionWithLang(version),
    });

    expect(root.find('.AddonVersionCard-compatibility')).toHaveText(
      `Works with ${app} ${min} to ${max}`,
    );
  });

  it('renders nothing for compatibility when no version is loaded', () => {
    const root = render({
      version: null,
    });

    expect(root.find('.AddonVersionCard-compatibility')).toHaveLength(0);
  });

  describe('file info', () => {
    it('renders a released date and file size', () => {
      const i18n = fakeI18n();
      const created = '1967-02-19T10:09:01Z';
      const size = 12345;
      const version = {
        ...fakeVersion,
        files: [{ ...fakePlatformFile, created, size }],
      };
      const addon = { ...fakeAddon, current_version: version };
      _loadVersions({ addon });

      const root = render({
        version: createInternalVersionWithLang(version),
      });

      expect(root.find('.AddonVersionCard-fileInfo')).toHaveText(
        `Released ${i18n.moment(created).format('ll')} - ${formatFilesize({
          i18n,
          size,
        })}`,
      );
    });

    it('renders nothing for released date and file size when no file exists for the version', () => {
      const version = { ...fakeVersion, files: [] };
      const addon = { ...fakeAddon, current_version: version };
      _loadVersions({ addon });

      const root = render({
        version: createInternalVersionWithLang(version),
      });

      expect(root.find('.AddonVersionCard-fileInfo')).toHaveLength(0);
    });
  });

  it('renders release notes', () => {
    const releaseNotes = 'Some release notes';
    const root = render({
      version: createInternalVersionWithLang({
        ...fakeVersion,
        release_notes: createLocalizedString(releaseNotes),
      }),
    });

    expect(root.find('.AddonVersionCard-releaseNotes').html()).toContain(
      releaseNotes,
    );
  });

  it('strips illegal HTML from release notes', () => {
    const releaseNotes = '<b>Some release notes</b>';
    const badReleaseNotes = `<script>alert()</script>${releaseNotes}`;
    const root = render({
      version: createInternalVersionWithLang({
        ...fakeVersion,
        release_notes: createLocalizedString(badReleaseNotes),
      }),
    });

    expect(root.find('.AddonVersionCard-releaseNotes').html()).toContain(
      releaseNotes,
    );
  });

  it('displays a license name', () => {
    const licenseName = 'some license name';
    const root = render({
      version: createInternalVersionWithLang({
        ...fakeVersion,
        license: {
          ...fakeVersion.license,
          name: createLocalizedString(licenseName),
        },
      }),
    });

    const license = root.find('.AddonVersionCard-license');
    expect(license.childAt(0)).toHaveText('Source code released under ');
    expect(license.childAt(1).children()).toHaveText(licenseName);
  });

  it('displays a license without a name', () => {
    const licenseName = null;
    const root = render({
      version: createInternalVersionWithLang({
        ...fakeVersion,
        license: {
          ...fakeVersion.license,
          name: createLocalizedString(licenseName),
        },
      }),
    });

    const license = root.find('.AddonVersionCard-license');
    expect(license.childAt(1).children()).toHaveText('Custom License');
  });

  it('renders a link to a non-custom license', () => {
    const licenseURL = 'http://example.com/';
    const root = render({
      version: createInternalVersionWithLang({
        ...fakeVersion,
        license: { ...fakeVersion.license, url: licenseURL },
      }),
    });

    expect(root.find('.AddonVersionCard-license').find(Link)).toHaveProp(
      'href',
      licenseURL,
    );
  });

  it('renders a link to a custom license', () => {
    const slug = 'some-slug';
    const addon = createInternalAddonWithLang({ ...fakeAddon, slug });
    const root = render({
      addon,
      version: createInternalVersionWithLang({
        ...fakeVersion,
        license: { ...fakeVersion.license, is_custom: true },
      }),
    });

    expect(root.find('.AddonVersionCard-license').find(Link)).toHaveProp(
      'to',
      `/addon/${slug}/license/`,
    );
  });

  it('does not render license info if there is no license', () => {
    const slug = 'some-slug';
    const addon = createInternalAddonWithLang({ ...fakeAddon, slug });
    const root = render({
      addon,
      version: createInternalVersionWithLang({
        ...fakeVersion,
        license: null,
      }),
    });

    expect(root.find('.AddonVersionCard-license')).toHaveLength(0);
  });

  it('renders plain text when license has no URL', () => {
    const slug = 'some-slug';
    const licenseName = 'some license without URL';
    const addon = createInternalAddonWithLang({ ...fakeAddon, slug });

    const root = render({
      addon,
      version: createInternalVersionWithLang({
        ...fakeVersion,
        license: {
          ...fakeVersion.license,
          name: createLocalizedString(licenseName),
          url: null,
        },
      }),
    });

    expect(root.find('.AddonVersionCard-license').find(Link)).toHaveLength(0);
    expect(root.find('.AddonVersionCard-license')).toIncludeText(licenseName);
  });

  it('passes an install error to AddonInstallError', () => {
    const guid = 'some-guid';
    const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
    store.dispatch(
      setInstallState({
        guid,
        status: INSTALLING,
      }),
    );
    const error = FATAL_ERROR;
    store.dispatch(setInstallError({ error, guid }));

    const root = render({ addon });

    expect(root.find(AddonInstallError)).toHaveProp('error', error);
  });

  it('does not render an AddonInstallError if there is no version', () => {
    const root = render({ version: null });

    expect(root.find(AddonInstallError)).toHaveLength(0);
  });

  it('passes an add-on and a version to AddonCompatibilityError', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const version = createInternalVersionWithLang(fakeVersion);

    const root = render({ addon, version });

    expect(root.find(AddonCompatibilityError)).toHaveProp('addon', addon);
    expect(root.find(AddonCompatibilityError)).toHaveProp('version', version);
  });

  it('does not render an AddonCompatibilityError if there is no version', () => {
    const root = render({ version: null });

    expect(root.find(AddonCompatibilityError)).toHaveLength(0);
  });

  it('passes an add-on to InstallButtonWrapper', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = render({ addon });

    expect(root.find(InstallButtonWrapper)).toHaveProp('addon', addon);
  });

  it('does not render an InstallButtonWrapper if there is no add-on', () => {
    const root = render({ addon: null });

    expect(root.find(InstallButtonWrapper)).toHaveLength(0);
  });

  it('does not render an InstallButtonWrapper if there is no version', () => {
    const root = render({
      addon: createInternalAddonWithLang(fakeAddon),
      version: null,
    });

    expect(root.find(InstallButtonWrapper)).toHaveLength(0);
  });

  describe('InstallWarning', () => {
    it('renders the InstallWarning if an add-on exists', () => {
      const root = render({ addon: createInternalAddonWithLang(fakeAddon) });

      expect(root.find(InstallWarning)).toHaveLength(1);
    });

    it('does not render the InstallWarning if an add-on does not exist', () => {
      const root = render({ addon: undefined });

      expect(root.find(InstallWarning)).toHaveLength(0);
    });

    it('passes the addon to the InstallWarning', () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const root = render({ addon });

      expect(root.find(InstallWarning)).toHaveProp('addon', addon);
    });
  });
});
