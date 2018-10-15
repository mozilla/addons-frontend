import UAParser from 'ua-parser-js';

import versionsReducer, {
  createInternalVersion,
  fetchVersions,
  getLoadingBySlug,
  getVersionInfo,
  getVersionsBySlug,
  initialState,
  loadVersions,
} from 'amo/reducers/versions';
import { createPlatformFiles } from 'core/reducers/addons';
import { fakeVersion, userAgentsByPlatform } from 'tests/unit/helpers';

describe(__filename, () => {
  it('defaults to its initial state', () => {
    expect(versionsReducer(undefined, { type: 'SOME_OTHER_ACTION' })).toEqual(
      initialState,
    );
  });

  it('sets a loading flag when fetching versions', () => {
    const slug = 'some-slug';
    const state = versionsReducer(
      undefined,
      fetchVersions({ errorHandlerId: 1, slug }),
    );

    expect(getLoadingBySlug({ state, slug })).toBe(true);
  });

  it('clears versions when fetching versions', () => {
    const slug = 'some-slug';
    const state = versionsReducer(
      undefined,
      fetchVersions({ errorHandlerId: 1, slug }),
    );

    expect(getVersionsBySlug({ slug, state })).toBe(null);
  });

  it('clears the loading flag when loading versions', () => {
    let state;
    const slug = 'some-slug';
    state = versionsReducer(
      undefined,
      fetchVersions({ errorHandlerId: 1, slug }),
    );
    state = versionsReducer(
      state,
      loadVersions({ slug, versions: [fakeVersion] }),
    );

    expect(getLoadingBySlug({ slug, state })).toBe(false);
  });

  it('loads versions', () => {
    const slug = 'some-slug';
    const versions = [fakeVersion, fakeVersion];
    const state = versionsReducer(undefined, loadVersions({ slug, versions }));

    expect(getVersionsBySlug({ slug, state })).toEqual([
      createInternalVersion(versions[0]),
      createInternalVersion(versions[1]),
    ]);
  });

  describe('createInternalVersion', () => {
    it('returns an object with the expected AddonVersionType', () => {
      expect(createInternalVersion(fakeVersion)).toEqual({
        compatibility: fakeVersion.compatibility,
        platformFiles: createPlatformFiles(fakeVersion),
        id: fakeVersion.id,
        license: {
          name: fakeVersion.license.name,
          url: fakeVersion.license.url,
        },
        releaseNotes: fakeVersion.release_notes,
        version: fakeVersion.version,
      });
    });
  });

  describe('getLoadingBySlug', () => {
    it('returns false if versions have never been loaded', () => {
      const state = versionsReducer(undefined, { type: 'SOME_OTHER_ACTION' });
      expect(getLoadingBySlug({ slug: 'some-slug', state })).toBe(false);
    });
  });

  describe('getVersionsBySlug', () => {
    it('returns null if no versions have been loaded', () => {
      const state = versionsReducer(undefined, { type: 'SOME_OTHER_ACTION' });
      expect(getVersionsBySlug({ slug: 'some-slug', state })).toBe(null);
    });
  });

  describe('getVersionInfo', () => {
    it('returns created and filesize from a version file', () => {
      const created = Date().toString();
      const size = 1234;
      const _findFileForPlatform = sinon.stub().returns({ created, size });

      expect(
        getVersionInfo({
          _findFileForPlatform,
          version: createInternalVersion(fakeVersion),
          userAgentInfo: UAParser(userAgentsByPlatform.windows.firefox40),
        }),
      ).toEqual({ created, filesize: size });
    });

    it('returns null values when no file is found', () => {
      const _findFileForPlatform = sinon.stub().returns(undefined);

      expect(
        getVersionInfo({
          _findFileForPlatform,
          version: createInternalVersion(fakeVersion),
          userAgentInfo: UAParser(userAgentsByPlatform.windows.firefox40),
        }),
      ).toEqual(null);
    });
  });
});
