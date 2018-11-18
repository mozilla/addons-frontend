import UAParser from 'ua-parser-js';

import { loadAddonsByAuthors } from 'amo/reducers/addonsByAuthors';
import {
  loadCollectionAddons,
  loadCurrentCollectionPage,
  loadCurrentCollection,
} from 'amo/reducers/collections';
import { loadHomeAddons } from 'amo/reducers/home';
import { loadLanding } from 'amo/reducers/landing';
import {
  OUTCOME_RECOMMENDED,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import versionsReducer, {
  createInternalVersion,
  fetchVersions,
  getLoadingBySlug,
  getVersionById,
  getVersionInfo,
  getVersionsBySlug,
  initialState,
  loadVersions,
  createPlatformFiles,
  defaultPlatformFiles,
} from 'core/reducers/versions';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import { ADDON_TYPE_EXTENSION, OS_MAC, OS_WINDOWS } from 'core/constants';
import { loadAddonResults } from 'core/reducers/addons';
import { searchLoad } from 'core/reducers/search';
import {
  createAddonsApiResult,
  createFakeCollectionAddon,
  createFakeCollectionDetail,
  fakeAddon,
  fakePlatformFile,
  fakeVersion,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

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

    expect(getVersionsBySlug({ slug, state })).toEqual(null);
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

  describe('createPlatformFiles', () => {
    it('creates a default object if there is no version', () => {
      expect(createPlatformFiles(undefined)).toEqual(defaultPlatformFiles);
    });

    it('creates a default object if there are no files', () => {
      expect(createPlatformFiles({ ...fakeVersion, files: [] })).toEqual(
        defaultPlatformFiles,
      );
    });

    it('creates a PlatformFilesType object from a version with files', () => {
      const windowsFile = {
        ...fakePlatformFile,
        platform: OS_WINDOWS,
      };
      const macFile = {
        ...fakePlatformFile,
        platform: OS_MAC,
      };
      expect(
        createPlatformFiles({
          ...fakeVersion,
          files: [windowsFile, macFile],
        }),
      ).toEqual({
        ...defaultPlatformFiles,
        [OS_WINDOWS]: windowsFile,
        [OS_MAC]: macFile,
      });
    });

    it('handles files for unknown platforms', () => {
      const unknownPlatform = 'unknownPlatform';
      const unknownFile = {
        ...fakePlatformFile,
        platform: unknownPlatform,
      };
      expect(
        createPlatformFiles({
          ...fakeVersion,
          files: [unknownFile],
        }),
      ).toEqual({
        ...defaultPlatformFiles,
        [unknownPlatform]: unknownFile,
      });
    });
  });

  describe('createInternalVersion', () => {
    it('returns an object with the expected AddonVersionType', () => {
      expect(createInternalVersion(fakeVersion)).toEqual({
        compatibility: fakeVersion.compatibility,
        id: fakeVersion.id,
        isStrictCompatibilityEnabled: Boolean(
          fakeVersion.is_strict_compatibility_enabled,
        ),
        license: {
          name: fakeVersion.license.name,
          url: fakeVersion.license.url,
        },
        platformFiles: createPlatformFiles(fakeVersion),
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
      expect(getVersionsBySlug({ slug: 'some-slug', state })).toEqual(null);
    });
  });

  describe('getVersionInfo', () => {
    it('returns created and filesize from a version file', () => {
      const created = Date().toString();
      const size = 1234;
      const _findFileForPlatform = sinon.stub().returns({ created, size });

      const state = versionsReducer(
        undefined,
        loadVersions({ slug: 'some-slug', versions: [fakeVersion] }),
      );

      expect(
        getVersionInfo({
          _findFileForPlatform,
          state,
          versionId: fakeVersion.id,
          userAgentInfo: UAParser(userAgentsByPlatform.windows.firefox40),
        }),
      ).toEqual({ created, filesize: size });
    });

    it('returns null when no version has been loaded', () => {
      const _findFileForPlatform = sinon.stub().returns(undefined);

      expect(
        getVersionInfo({
          _findFileForPlatform,
          state: initialState,
          versionId: 1,
          userAgentInfo: UAParser(userAgentsByPlatform.windows.firefox40),
        }),
      ).toEqual(null);
    });

    it('returns null when no file is found', () => {
      const _findFileForPlatform = sinon.stub().returns(undefined);

      const state = versionsReducer(
        undefined,
        loadVersions({ slug: 'some-slug', versions: [fakeVersion] }),
      );

      expect(
        getVersionInfo({
          _findFileForPlatform,
          state,
          versionId: fakeVersion.id,
          userAgentInfo: UAParser(userAgentsByPlatform.windows.firefox40),
        }),
      ).toEqual(null);
    });
  });

  describe('getVersionById', () => {
    it('returns a loaded version', () => {
      const state = versionsReducer(
        undefined,
        loadVersions({ slug: 'some-slug', versions: [fakeVersion] }),
      );

      expect(
        getVersionById({
          state,
          id: fakeVersion.id,
        }),
      ).toEqual(createInternalVersion(fakeVersion));
    });

    it('returns null when no version has been loaded', () => {
      expect(
        getVersionById({
          state: initialState,
          id: fakeVersion.id,
        }),
      ).toEqual(null);
    });
  });

  describe('load versions for add-ons', () => {
    const versionId = 99;
    const version = { ...fakeVersion, id: versionId };

    describe('LOAD_ADDONS_BY_AUTHORS', () => {
      const _loadAddonsByAuthors = ({
        addons = [{ ...fakeAddon, current_version: version }],
      } = {}) => {
        return loadAddonsByAuthors({
          addons,
          authorIds: [fakeAddon.authors[0].id],
          count: addons.length,
          pageSize: DEFAULT_API_PAGE_SIZE,
        });
      };

      it('loads versions', () => {
        const state = versionsReducer(undefined, _loadAddonsByAuthors());

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });

      it('handles no add-ons', () => {
        const state = versionsReducer(
          undefined,
          _loadAddonsByAuthors({ addons: [] }),
        );

        expect(state.byId).toEqual({});
      });

      it('handles an add-on without a current_version', () => {
        const state = versionsReducer(
          undefined,
          _loadAddonsByAuthors({
            addons: [
              {
                ...fakeAddon,
                current_version: undefined,
              },
            ],
          }),
        );

        expect(state.byId).toEqual({});
      });
    });

    describe('LOAD_CURRENT_COLLECTION', () => {
      it('loads versions', () => {
        const fakeCollectionAddon = createFakeCollectionAddon({
          addon: { ...fakeAddon, current_version: version },
        });

        const state = versionsReducer(
          undefined,
          loadCurrentCollection({
            addons: [fakeCollectionAddon],
            detail: createFakeCollectionDetail(),
            pageSize: DEFAULT_API_PAGE_SIZE,
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });
    });

    describe('LOAD_CURRENT_COLLECTION_PAGE', () => {
      it('loads versions', () => {
        const fakeCollectionAddon = createFakeCollectionAddon({
          addon: { ...fakeAddon, current_version: version },
        });

        const state = versionsReducer(
          undefined,
          loadCurrentCollectionPage({
            addons: [fakeCollectionAddon],
            numberOfAddons: 1,
            pageSize: DEFAULT_API_PAGE_SIZE,
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });
    });

    describe('LOAD_COLLECTION_ADDONS', () => {
      it('loads versions', () => {
        const fakeCollectionAddon = createFakeCollectionAddon({
          addon: { ...fakeAddon, current_version: version },
        });

        const state = versionsReducer(
          undefined,
          loadCollectionAddons({
            addons: [fakeCollectionAddon],
            slug: 'sone-slug',
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });
    });

    describe('LOAD_HOME_ADDONS', () => {
      it('loads versions from shelves', () => {
        const state = versionsReducer(
          undefined,
          loadHomeAddons({
            collections: [],
            shelves: {
              featuredExtensions: createAddonsApiResult([
                { ...fakeAddon, current_version: version },
              ]),
            },
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });

      it('handles invalid shelves', () => {
        const state = versionsReducer(
          undefined,
          loadHomeAddons({
            collections: [],
            shelves: {
              featuredExtensions: null,
            },
          }),
        );

        expect(state).toEqual(initialState);
      });

      it('loads versions for collections', () => {
        const versionId2 = 111;
        const version2 = { ...fakeVersion, id: versionId2 };
        const fakeCollectionAddon1 = createFakeCollectionAddon({
          addon: { ...fakeAddon, current_version: version },
        });
        const fakeCollectionAddon2 = createFakeCollectionAddon({
          addon: { ...fakeAddon, current_version: version2 },
        });

        const state = versionsReducer(
          undefined,
          loadHomeAddons({
            collections: [
              { results: [fakeCollectionAddon1] },
              { results: [fakeCollectionAddon2] },
            ],
            shelves: {},
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
        expect(
          getVersionById({
            state,
            id: versionId2,
          }),
        ).toEqual(createInternalVersion(version2));
      });
    });

    describe('LOAD_LANDING', () => {
      it('loads versions for featured add-ons', () => {
        const state = versionsReducer(
          undefined,
          loadLanding({
            addonType: ADDON_TYPE_EXTENSION,
            featured: createAddonsApiResult([
              { ...fakeAddon, current_version: version },
            ]),
            highlyRated: createAddonsApiResult([]),
            trending: createAddonsApiResult([]),
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });

      it('loads versions for highlyRated add-ons', () => {
        const state = versionsReducer(
          undefined,
          loadLanding({
            addonType: ADDON_TYPE_EXTENSION,
            featured: createAddonsApiResult([]),
            highlyRated: createAddonsApiResult([
              { ...fakeAddon, current_version: version },
            ]),
            trending: createAddonsApiResult([]),
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });

      it('loads versions for trending add-ons', () => {
        const state = versionsReducer(
          undefined,
          loadLanding({
            addonType: ADDON_TYPE_EXTENSION,
            featured: createAddonsApiResult([]),
            highlyRated: createAddonsApiResult([]),
            trending: createAddonsApiResult([
              { ...fakeAddon, current_version: version },
            ]),
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });
    });

    describe('LOAD_RECOMMENDATIONS', () => {
      const versionForRecommendations = {
        ...version,
        license: undefined,
        release_notes: undefined,
      };

      it('loads versions', () => {
        const state = versionsReducer(
          undefined,
          loadRecommendations({
            addons: [
              {
                ...fakeAddon,
                current_version: versionForRecommendations,
              },
            ],
            guid: fakeAddon.guid,
            outcome: OUTCOME_RECOMMENDED,
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(versionForRecommendations));
      });

      it('does not overwrite license and releaseNotes', () => {
        const slug = 'some-slug';
        const testVersion = {
          ...version,
          license: { name: 'test name', url: 'https://addons.mozilla.org/' },
          release_notes: 'some release notes',
        };

        let state = versionsReducer(
          undefined,
          loadVersions({ slug, versions: [testVersion] }),
        );

        state = versionsReducer(
          state,
          loadRecommendations({
            addons: [
              {
                ...fakeAddon,
                current_version: versionForRecommendations,
              },
            ],
            guid: fakeAddon.guid,
            outcome: OUTCOME_RECOMMENDED,
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(testVersion));
      });
    });

    describe('LOAD_ADDON_RESULTS', () => {
      it('loads versions', () => {
        const state = versionsReducer(
          undefined,
          loadAddonResults({
            addons: [
              {
                ...fakeAddon,
                current_version: version,
              },
            ],
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });
    });

    describe('SEARCH_LOADED', () => {
      it('loads versions', () => {
        const state = versionsReducer(
          undefined,
          searchLoad({
            count: 1,
            pageSize: DEFAULT_API_PAGE_SIZE,
            results: [
              {
                ...fakeAddon,
                current_version: version,
              },
            ],
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersion(version));
      });
    });
  });
});
