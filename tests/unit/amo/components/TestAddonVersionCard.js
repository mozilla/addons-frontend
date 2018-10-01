import * as React from 'react';

import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonInstallError from 'amo/components/AddonInstallError';
import AddonVersionCard, {
  AddonVersionCardBase,
} from 'amo/components/AddonVersionCard';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import Link from 'amo/components/Link';
import { setInstallError, setInstallState } from 'core/actions/installations';
import { FATAL_ERROR, INSTALLING } from 'core/constants';
import { formatFilesize } from 'core/i18n/utils';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalVersion, loadVersions } from 'core/reducers/versions';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakePlatformFile,
  fakeVersion,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return shallowUntilTarget(
      <AddonVersionCard
        addon={createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        version={createInternalVersion(fakeAddon.current_version)}
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

  it('returns only loading text if version is null', () => {
    const root = render({
      version: null,
    });

    expect(root.find(LoadingText)).toHaveLength(1);
    expect(root.find('.AddonVersionCard')).toHaveLength(0);
  });

  it('renders a version number', () => {
    const versionNumber = '1.0';
    const root = render({
      version: createInternalVersion({
        ...fakeVersion,
        version: versionNumber,
      }),
    });

    expect(root.find('.AddonVersionCard-version')).toHaveText(
      `Version ${versionNumber}`,
    );
  });

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
      version: createInternalVersion(version),
    });

    expect(root.find('.AddonVersionCard-fileInfo')).toHaveText(
      `Released ${i18n.moment(created).format('ll')} - ${formatFilesize({
        i18n,
        size,
      })}`,
    );
  });

  it('renders a release notes', () => {
    const releaseNotes = 'Some release notes';
    const root = render({
      version: createInternalVersion({
        ...fakeVersion,
        release_notes: releaseNotes,
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
      version: createInternalVersion({
        ...fakeVersion,
        release_notes: badReleaseNotes,
      }),
    });

    expect(root.find('.AddonVersionCard-releaseNotes').html()).toContain(
      releaseNotes,
    );
  });

  it('displays a license name', () => {
    const licenseName = 'some license name';
    const root = render({
      version: createInternalVersion({
        ...fakeVersion,
        license: { ...fakeVersion.license, name: licenseName },
      }),
    });

    const license = root.find('.AddonVersionCard-license');
    expect(license.childAt(0)).toHaveText('Source code released under ');
    expect(license.childAt(1).children()).toHaveText(licenseName);
  });

  it('renders a link to a non-custom license', () => {
    const licenseURL = 'http://example.com/';
    const root = render({
      version: createInternalVersion({
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
    const addon = createInternalAddon({ ...fakeAddon, slug });
    const root = render({
      addon,
      version: createInternalVersion({
        ...fakeVersion,
        license: { ...fakeVersion.license, is_custom: true },
      }),
    });

    expect(root.find('.AddonVersionCard-license').find(Link)).toHaveProp(
      'to',
      `/addon/${slug}/license/`,
    );
  });

  it('passes an install error to AddonInstallError', () => {
    const guid = 'some-guid';
    const addon = createInternalAddon({ ...fakeAddon, guid });
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

  it('passes an add-on to AddonCompatibilityError', () => {
    const addon = createInternalAddon(fakeAddon);

    const root = render({ addon });

    expect(root.find(AddonCompatibilityError)).toHaveProp('addon', addon);
  });

  it('passes an add-on to InstallButtonWrapper', () => {
    const addon = createInternalAddon(fakeAddon);

    const root = render({ addon });

    expect(root.find(InstallButtonWrapper)).toHaveProp('addon', addon);
  });

  it('does not render an InstallButtonWrapper if there is no add-on', () => {
    const root = render({ addon: null });

    expect(root.find(InstallButtonWrapper)).toHaveLength(0);
  });
});
