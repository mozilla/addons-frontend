import UAParser from 'ua-parser-js';

import { loadAddonsByAuthors } from 'amo/reducers/addonsByAuthors';
import {
  loadCollectionAddons,
  loadCurrentCollectionPage,
  loadCurrentCollection,
} from 'amo/reducers/collections';
import { loadHomeData } from 'amo/reducers/home';
import { loadLanding } from 'amo/reducers/landing';
import {
  OUTCOME_RECOMMENDED,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import { formatFilesize } from 'core/i18n/utils';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import { ADDON_TYPE_EXTENSION, OS_MAC, OS_WINDOWS } from 'core/constants';
import { loadAddonResults } from 'core/reducers/addons';
import { searchLoad } from 'core/reducers/search';
import versionsReducer, {
  createInternalVersion,
  fetchVersion,
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
import {
  createAddonsApiResult,
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  fakeAddon,
  fakeI18n,
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

  it('sets a loading flag when fetching a version', () => {
    const slug = 'some-slug';
    const state = versionsReducer(
      undefined,
      fetchVersion({ errorHandlerId: 1, slug, versionId: 1 }),
    );

    expect(getLoadingBySlug({ state, slug })).toBe(true);
  });

  it('clears versions when fetching a version', () => {
    const slug = 'some-slug';
    const state = versionsReducer(
      undefined,
      fetchVersion({ errorHandlerId: 1, slug, versionId: 1 }),
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

  it('loads a version with license text', () => {
    const slug = 'some-slug';
    const licenseText = 'license text';
    const version = {
      ...fakeVersion,
      license: {
        ...fakeVersion.license,
        text: licenseText,
      },
    };
    const state = versionsReducer(
      undefined,
      loadVersions({ slug, versions: [version] }),
    );

    const firstStoredVersion = getVersionsBySlug({ slug, state })[0];
    expect(firstStoredVersion).toEqual(createInternalVersion(version));
    expect(firstStoredVersion.license.text).toEqual(licenseText);
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
          isCustom: fakeVersion.license.is_custom,
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
    const _getVersionInfo = ({
      _findFileForPlatform = sinon.spy(),
      state = initialState,
      versionId,
      userAgentInfo = UAParser(userAgentsByPlatform.windows.firefox40),
    }) => {
      return getVersionInfo({
        _findFileForPlatform,
        i18n: fakeI18n(),
        state,
        versionId,
        userAgentInfo,
      });
    };
    it('returns created and filesize from a version file', () => {
      const created = Date().toString();
      const size = 1234;
      const _findFileForPlatform = sinon.stub().returns({ created, size });

      const state = versionsReducer(
        undefined,
        loadVersions({ slug: 'some-slug', versions: [fakeVersion] }),
      );

      expect(
        _getVersionInfo({
          _findFileForPlatform,
          state,
          versionId: fakeVersion.id,
        }),
      ).toMatchObject({
        created,
        filesize: formatFilesize({ i18n: fakeI18n(), size }),
      });
    });

    it('returns null when no version has been loaded', () => {
      expect(
        _getVersionInfo({
          versionId: 1,
        }),
      ).toEqual(null);
    });

    it('returns null for created and filesize when no file is found', () => {
      const _findFileForPlatform = sinon.stub().returns(undefined);

      const state = versionsReducer(
        undefined,
        loadVersions({ slug: 'some-slug', versions: [fakeVersion] }),
      );

      expect(
        _getVersionInfo({
          _findFileForPlatform,
          state,
          versionId: fakeVersion.id,
        }),
      ).toMatchObject({ created: null, filesize: null });
    });

    it('returns the expected compatibility string for a max=*', () => {
      const app = 'testApp';
      const min = '1.0';
      const version = {
        ...fakeVersion,
        compatibility: {
          [app]: {
            min,
            max: '*',
          },
        },
      };
      const state = versionsReducer(
        undefined,
        loadVersions({
          slug: 'some-slug',
          versions: [version],
        }),
      );

      expect(
        _getVersionInfo({
          state,
          versionId: version.id,
        }).compatibilityString,
      ).toEqual(`Works with ${app} ${min} and later`);
    });

    it('returns the expected compatibility string for max and min', () => {
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
      const state = versionsReducer(
        undefined,
        loadVersions({
          slug: 'some-slug',
          versions: [version],
        }),
      );

      expect(
        _getVersionInfo({
          state,
          versionId: version.id,
        }).compatibilityString,
      ).toEqual(`Works with ${app} ${min} to ${max}`);
    });

    it('returns a compatibility string for multiple apps', () => {
      const app1 = 'testApp1';
      const app2 = 'testApp2';
      const min = '1.0';
      const version = {
        ...fakeVersion,
        compatibility: {
          [app1]: {
            min,
            max: '*',
          },
          [app2]: {
            min,
            max: '*',
          },
        },
      };
      const state = versionsReducer(
        undefined,
        loadVersions({
          slug: 'some-slug',
          versions: [version],
        }),
      );

      expect(
        _getVersionInfo({
          state,
          versionId: version.id,
        }).compatibilityString,
      ).toEqual(
        `Works with ${app1} ${min} and later, ${app2} ${min} and later`,
      );
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
            addonsResponse: createFakeCollectionAddonsListResponse({
              addons: [fakeCollectionAddon],
            }),
            detail: createFakeCollectionDetail(),
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
            addonsResponse: createFakeCollectionAddonsListResponse({
              addons: [fakeCollectionAddon],
            }),
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

    describe('LOAD_HOME_DATA', () => {
      it('loads versions from shelves', () => {
        const state = versionsReducer(
          undefined,
          loadHomeData({
            collections: [],
            shelves: {
              recommendedExtensions: createAddonsApiResult([
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

      it('maintains license and release notes from pre-existing versions', () => {
        let state = versionsReducer(
          undefined,
          loadVersions({ slug: fakeAddon.slug, versions: [version] }),
        );

        // Create a search result with missing license and release_notes.
        const searchResult = createAddonsApiResult([
          {
            ...fakeAddon,
            current_version: {
              ...version,
              license: undefined,
              release_notes: undefined,
            },
          },
        ]);

        state = versionsReducer(
          state,
          loadHomeData({
            collections: [],
            shelves: {
              recommendedExtensions: searchResult,
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
          loadHomeData({
            collections: [],
            shelves: {
              recommendedExtensions: null,
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
          loadHomeData({
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
      it('loads versions for recommended add-ons', () => {
        const state = versionsReducer(
          undefined,
          loadLanding({
            addonType: ADDON_TYPE_EXTENSION,
            recommended: createAddonsApiResult([
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
            recommended: createAddonsApiResult([]),
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
            recommended: createAddonsApiResult([]),
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
