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
import { formatFilesize } from 'amo/i18n/utils';
import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import { loadAddon } from 'amo/reducers/addons';
import { setLang } from 'amo/reducers/api';
import { searchLoad } from 'amo/reducers/search';
import { selectLocalizedContent } from 'amo/reducers/utils';
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
} from 'amo/reducers/versions';
import {
  createAddonsApiResult,
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  createInternalVersionWithLang,
  createLocalizedString,
  fakeExternalShelf,
  fakeAddon,
  fakeI18n,
  fakeFile,
  fakeVersion,
} from 'tests/unit/helpers';

describe(__filename, () => {
  // We need a state with setLang called for any tests that load versions.
  const lang = 'en-US';
  const stateWithLang = versionsReducer(undefined, setLang(lang));

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
      stateWithLang,
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
    const state = versionsReducer(
      stateWithLang,
      loadVersions({ slug, versions }),
    );

    expect(getVersionsBySlug({ slug, state })).toEqual([
      createInternalVersionWithLang(versions[0]),
      createInternalVersionWithLang(versions[1]),
    ]);
  });

  it('loads a version with license text', () => {
    const slug = 'some-slug';
    const licenseText = 'license text';
    const version = {
      ...fakeVersion,
      license: {
        ...fakeVersion.license,
        text: createLocalizedString(licenseText),
      },
    };
    const state = versionsReducer(
      stateWithLang,
      loadVersions({ slug, versions: [version] }),
    );

    const firstStoredVersion = getVersionsBySlug({ slug, state })[0];
    expect(firstStoredVersion).toEqual(createInternalVersionWithLang(version));
    expect(firstStoredVersion.license.text).toEqual(licenseText);
  });

  describe('createInternalVersion', () => {
    it('returns an object with the expected AddonVersionType', () => {
      const licenceText = 'licence text';
      const version = {
        ...fakeVersion,
        license: {
          ...fakeVersion.license,
          text: createLocalizedString(licenceText, lang),
        },
      };

      expect(createInternalVersion(version, lang)).toEqual({
        compatibility: fakeVersion.compatibility,
        id: fakeVersion.id,
        isStrictCompatibilityEnabled: Boolean(
          fakeVersion.is_strict_compatibility_enabled,
        ),
        license: {
          isCustom: fakeVersion.license.is_custom,
          name: selectLocalizedContent(fakeVersion.license.name, lang),
          text: licenceText,
          url: fakeVersion.license.url,
        },
        file: fakeFile,
        releaseNotes: selectLocalizedContent(fakeVersion.release_notes, lang),
        version: fakeVersion.version,
      });
    });

    it('returns null for license.text if it is missing from the response', () => {
      // fakeVersion does not include license.text.
      const version = createInternalVersion(fakeVersion, lang);
      expect(version.license.text).toEqual(null);
    });

    // See https://github.com/mozilla/addons-frontend/issues/11337
    it('overwrites version 91.1.0 with 91.0.0 for firefox', () => {
      const version = {
        ...fakeVersion,
        compatibility: {
          [CLIENT_APP_ANDROID]: {
            min: '91.1.0',
            max: '*',
          },
          [CLIENT_APP_FIREFOX]: {
            min: '91.1.0',
            max: '*',
          },
        },
      };

      const internalVersion = createInternalVersion(version, lang);
      expect(internalVersion.compatibility).toEqual({
        [CLIENT_APP_ANDROID]: {
          min: '91.1.0',
          max: '*',
        },
        [CLIENT_APP_FIREFOX]: {
          min: '91.0.0',
          max: '*',
        },
      });

      // Also test that it doesn't break anything if firefox compatibility is missing.
      const versionWithouFirefox = {
        ...fakeVersion,
        compatibility: {
          [CLIENT_APP_ANDROID]: {
            min: '91.1.0',
            max: '*',
          },
        },
      };

      const internalVersionWithouFirefox = createInternalVersion(
        versionWithouFirefox,
        lang,
      );
      expect(internalVersionWithouFirefox.compatibility).toEqual({
        [CLIENT_APP_ANDROID]: {
          min: '91.1.0',
          max: '*',
        },
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
    const _getVersionInfo = ({ state = initialState, versionId }) => {
      return getVersionInfo({
        i18n: fakeI18n(),
        state,
        versionId,
      });
    };
    it('returns created and filesize from a version file', () => {
      const created = Date().toString();
      const size = 1234;

      const version = {
        ...fakeVersion,
        file: { created, size },
      };
      const state = versionsReducer(
        stateWithLang,
        loadVersions({
          slug: 'some-slug',
          versions: [version],
        }),
      );

      expect(
        _getVersionInfo({
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
        stateWithLang,
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
        stateWithLang,
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
        stateWithLang,
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
        stateWithLang,
        loadVersions({ slug: 'some-slug', versions: [fakeVersion] }),
      );

      expect(
        getVersionById({
          state,
          id: fakeVersion.id,
        }),
      ).toEqual(createInternalVersionWithLang(fakeVersion));
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
        const state = versionsReducer(stateWithLang, _loadAddonsByAuthors());

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersionWithLang(version));
      });

      it('handles no add-ons', () => {
        const state = versionsReducer(
          stateWithLang,
          _loadAddonsByAuthors({ addons: [] }),
        );

        expect(state.byId).toEqual({});
      });

      it('handles an add-on without a current_version', () => {
        const state = versionsReducer(
          stateWithLang,
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
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(version));
      });

      it('works when there are no add-ons in the collection', () => {
        const state = versionsReducer(
          stateWithLang,
          loadCurrentCollection({
            addonsResponse: undefined,
            detail: createFakeCollectionDetail(),
          }),
        );

        expect(getVersionById({ state, id: versionId })).toEqual(null);
      });
    });

    describe('LOAD_CURRENT_COLLECTION_PAGE', () => {
      it('loads versions', () => {
        const fakeCollectionAddon = createFakeCollectionAddon({
          addon: { ...fakeAddon, current_version: version },
        });

        const state = versionsReducer(
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(version));
      });
    });

    describe('LOAD_COLLECTION_ADDONS', () => {
      it('loads versions', () => {
        const fakeCollectionAddon = createFakeCollectionAddon({
          addon: { ...fakeAddon, current_version: version },
        });

        const state = versionsReducer(
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(version));
      });
    });

    describe('LOAD_HOME_DATA', () => {
      it('maintains license and release notes from pre-existing versions when loading homeShelves', () => {
        let state = versionsReducer(
          stateWithLang,
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
            homeShelves: {
              results: [{ ...fakeExternalShelf, addons: [searchResult] }],
            },
            shelves: {},
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersionWithLang(version));
      });

      it('maintains license and release notes from pre-existing versions when loading shelves', () => {
        let state = versionsReducer(
          stateWithLang,
          loadVersions({ slug: fakeAddon.slug, versions: [version] }),
        );

        // Create a search result with missing license and release_notes.
        const result = createAddonsApiResult([
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
            homeShelves: null,
            shelves: {
              someShelf: result,
            },
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersionWithLang(version));
      });

      it('handles invalid homeShelves', () => {
        const state = versionsReducer(
          stateWithLang,
          loadHomeData({
            homeShelves: null,
            shelves: {},
          }),
        );

        expect(state).toEqual(stateWithLang);
      });
    });

    describe('LOAD_LANDING', () => {
      it('loads versions for recommended add-ons', () => {
        const state = versionsReducer(
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(version));
      });

      it('loads versions for highlyRated add-ons', () => {
        const state = versionsReducer(
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(version));
      });

      it('loads versions for trending add-ons', () => {
        const state = versionsReducer(
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(version));
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
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(versionForRecommendations));
      });

      it('does not overwrite license and releaseNotes', () => {
        const slug = 'some-slug';
        const testVersion = {
          ...version,
          license: {
            name: createLocalizedString('test name', lang),
            url: 'https://addons.mozilla.org/',
          },
          release_notes: createLocalizedString('some release notes', lang),
        };

        let state = versionsReducer(
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(testVersion));
      });
    });

    describe('LOAD_ADDON', () => {
      it('loads versions', () => {
        const state = versionsReducer(
          stateWithLang,
          loadAddon({
            addon: {
              ...fakeAddon,
              current_version: version,
            },
            slug: fakeAddon.slug,
          }),
        );

        expect(
          getVersionById({
            state,
            id: versionId,
          }),
        ).toEqual(createInternalVersionWithLang(version));
      });
    });

    describe('SEARCH_LOADED', () => {
      it('loads versions', () => {
        const state = versionsReducer(
          stateWithLang,
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
        ).toEqual(createInternalVersionWithLang(version));
      });
    });
  });
});
