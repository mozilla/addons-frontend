import { unloadAddonReviews } from 'amo/actions/reviews';
import {
  ADDON_TYPE_EXTENSION,
  OS_ALL,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import addons, {
  createInternalAddon,
  createInternalAddonInfo,
  createPlatformFiles,
  defaultPlatformFiles,
  fetchAddon,
  fetchAddonInfo,
  getAddonByGUID,
  getAddonByID,
  getAddonBySlug,
  getAddonInfoBySlug,
  getAllAddons,
  getGuid,
  isAddonInfoLoading,
  initialState,
  isAddonLoading,
  loadAddonInfo,
  loadAddonResults,
} from 'core/reducers/addons';
import {
  createFakeAddon,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeAddonInfo,
  fakePlatformFile,
  fakeTheme,
  fakeVersion,
} from 'tests/unit/helpers';

describe(__filename, () => {
  it('defaults to its initial state', () => {
    expect(addons(undefined, { type: 'SOME_OTHER_ACTION' })).toEqual(
      initialState,
    );
  });

  it('ignores unrelated actions', () => {
    const firstState = addons(
      undefined,
      loadAddonResults({ addons: [fakeAddon] }),
    );
    expect(addons(firstState, { type: 'UNRELATED_ACTION' })).toEqual(
      firstState,
    );
  });

  it('stores addons from entities', () => {
    const firstState = addons(
      undefined,
      loadAddonResults({ addons: [fakeAddon] }),
    );

    const anotherFakeAddon = {
      ...fakeAddon,
      slug: 'testing1234',
      id: 6401,
    };
    const newState = addons(
      firstState,
      loadAddonResults({ addons: [anotherFakeAddon] }),
    );

    const internalAddon = createInternalAddon(anotherFakeAddon);
    expect(newState.byID).toEqual({
      ...firstState.byID,
      [anotherFakeAddon.id]: internalAddon,
    });
    expect(newState.bySlug).toEqual({
      ...firstState.bySlug,
      [anotherFakeAddon.slug]: anotherFakeAddon.id,
    });
    expect(newState.byGUID).toEqual({
      ...firstState.byGUID,
      [anotherFakeAddon.guid]: anotherFakeAddon.id,
    });
  });

  it('stores all add-ons, indexed by id', () => {
    const addonResults = [
      { ...fakeAddon, slug: 'first-slug', id: 123 },
      { ...fakeAddon, slug: 'second-slug', id: 456 },
    ];
    const state = addons(undefined, loadAddonResults({ addons: addonResults }));
    expect(Object.keys(state.byID).sort()).toEqual(['123', '456']);
  });

  it('stores all add-on slugs with their IDs', () => {
    const addonResults = [
      { ...fakeAddon, slug: 'first-slug', id: 123 },
      { ...fakeAddon, slug: 'second-slug', id: 456 },
    ];
    const state = addons(undefined, loadAddonResults({ addons: addonResults }));
    expect(state.bySlug).toEqual({
      'first-slug': 123,
      'second-slug': 456,
    });
  });

  it('stores all add-on slugs in lowercase', () => {
    const addonResults = [
      { ...fakeAddon, slug: 'FIRST', id: 123 },
      { ...fakeAddon, slug: 'SeCond', id: 456 },
    ];
    const state = addons(undefined, loadAddonResults({ addons: addonResults }));
    expect(state.bySlug).toEqual({
      first: 123,
      second: 456,
    });
  });

  it('ignores empty results', () => {
    const addonResults = [];
    const state = addons(undefined, loadAddonResults({ addons: addonResults }));
    expect(Object.keys(state.byID)).toEqual([]);
  });

  it('stores an internal representation of an extension', () => {
    const extension = { ...fakeAddon, type: ADDON_TYPE_EXTENSION };
    const state = addons(undefined, loadAddonResults({ addons: [extension] }));

    expect(state.byID[extension.id]).toEqual({
      ...extension,
      currentVersionId: fakeAddon.current_version.id,
      isRestartRequired: false,
      isWebExtension: true,
      isMozillaSignedExtension: false,
      themeData: null,
    });
  });

  it('stores an internal representation of a theme', () => {
    const theme = { ...fakeTheme };
    const state = addons(undefined, loadAddonResults({ addons: [theme] }));

    // We manually recreate the theme addon to test that the mapper is doing
    // what we expect it to below.
    const expectedTheme = {
      ...theme,
      themeData: theme.theme_data,
      guid: getGuid(theme),
      currentVersionId: fakeTheme.current_version.id,
      isRestartRequired: false,
      isWebExtension: true,
      isMozillaSignedExtension: false,
    };
    delete expectedTheme.theme_data;

    expect(state.byID[theme.id]).toEqual(expectedTheme);
  });

  it('does not let theme_data set properties to undefined', () => {
    const theme = {
      ...fakeTheme,
      theme_data: {
        ...fakeTheme.theme_data,
        id: undefined,
      },
    };
    const state = addons(undefined, loadAddonResults({ addons: [theme] }));

    expect(state.byID[theme.id].id).toEqual(theme.id);
  });

  it('does not store undefined properties', () => {
    const extension = { ...fakeAddon, description: undefined };
    const state = addons(undefined, loadAddonResults({ addons: [extension] }));

    // eslint-disable-next-line no-prototype-builtins
    expect(state.byID[extension.id].hasOwnProperty('description')).toEqual(
      false,
    );
  });

  it('mimics how Firefox appends @persona.mozilla.org to GUIDs', () => {
    const state = addons(undefined, loadAddonResults({ addons: [fakeTheme] }));

    expect(state.byID[fakeTheme.id].guid).toEqual('54321@personas.mozilla.org');
  });

  it('exposes `isRestartRequired` attribute from current version files', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isRestartRequired).toBe(true);
  });

  it('sets `isRestartRequired` to `false` when restart is not required', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
      ],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `false` when addon has no files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `true` when any file declares it', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isRestartRequired).toBe(true);
  });

  it('exposes `isWebExtension` attribute from current version files', () => {
    const addon = createFakeAddon({
      files: [{ is_webextension: true }],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isWebExtension).toBe(true);
  });

  it('sets `isWebExtension` to `false` when add-on is not a web extension', () => {
    const addon = createFakeAddon({
      files: [{ is_webextension: false }],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isWebExtension).toBe(false);
  });

  it('sets `isWebExtension` to `false` when addon has no files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isWebExtension).toBe(false);
  });

  it('sets `isWebExtension` to `true` when any file declares it', () => {
    const addon = createFakeAddon({
      files: [{ is_webextension: false }, { is_webextension: true }],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isWebExtension).toBe(true);
  });

  it('exposes `isMozillaSignedExtension` from current version files', () => {
    const addon = createFakeAddon({
      files: [{ is_mozilla_signed_extension: true }],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(true);
  });

  it('sets `isMozillaSignedExtension` to `false` when not declared', () => {
    const addon = createFakeAddon({
      files: [{ is_mozilla_signed_extension: false }],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(false);
  });

  it('sets `isMozillaSignedExtension` to `false` without files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(false);
  });

  it('sets `isMozillaSignedExtension` to `true` when any file declares it', () => {
    const addon = createFakeAddon({
      files: [
        { is_mozilla_signed_extension: false },
        { is_mozilla_signed_extension: true },
      ],
    });

    const state = addons(undefined, loadAddonResults({ addons: [addon] }));
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(true);
  });

  it('sets the loading state for add-ons to false', () => {
    const addonResults = [
      { ...fakeAddon, slug: 'first-slug' },
      { ...fakeAddon, slug: 'second-slug' },
    ];
    const state = addons(undefined, loadAddonResults({ addons: addonResults }));
    expect(state.loadingBySlug).toEqual({
      'first-slug': false,
      'second-slug': false,
    });
  });

  describe('fetchAddon', () => {
    const defaultParams = Object.freeze({
      slug: 'addon-slug',
      errorHandler: createStubErrorHandler(),
    });

    it('requires an error handler', () => {
      const params = { ...defaultParams };
      delete params.errorHandler;
      expect(() => fetchAddon(params)).toThrowError(
        /errorHandler cannot be empty/,
      );
    });

    it('requires a slug', () => {
      const params = { ...defaultParams };
      delete params.slug;
      expect(() => fetchAddon(params)).toThrowError(/slug cannot be empty/);
    });

    it('stores a loading state for an add-on', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({ slug, errorHandler: createStubErrorHandler() }),
      );
      expect(state.loadingBySlug[slug]).toBe(true);
    });

    it('is case insensitive', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug: slug.toUpperCase(),
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(state.loadingBySlug).toHaveProperty(slug);
    });
  });

  describe('loadAddonResults', () => {
    it('requires addons', () => {
      expect(() => {
        loadAddonResults();
      }).toThrow('addons are required');
    });
  });

  describe('getAddonByID', () => {
    it('returns null if no add-on found with the given slug', () => {
      const { state } = dispatchClientMetadata();

      expect(getAddonByID(state, 'id')).toEqual(null);
    });

    it('returns an add-on by id', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddonResults({ addons: [fakeAddon] }));

      expect(getAddonByID(store.getState(), fakeAddon.id)).toEqual(
        createInternalAddon(fakeAddon),
      );
    });
  });

  describe('getAddonBySlug', () => {
    it('returns null if no add-on found with the given slug', () => {
      const { state } = dispatchClientMetadata();

      expect(getAddonBySlug(state, 'slug')).toEqual(null);
    });

    it('returns null when slug is null', () => {
      const { state } = dispatchClientMetadata();

      expect(getAddonBySlug(state, null)).toEqual(null);
    });

    it('returns null when slug is undefined', () => {
      const { state } = dispatchClientMetadata();

      expect(getAddonBySlug(state, undefined)).toEqual(null);
    });

    it('returns null when slug is not a string', () => {
      const { state } = dispatchClientMetadata();

      expect(getAddonBySlug(state, 123)).toEqual(null);
    });

    it('returns an add-on by slug', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddonResults({ addons: [fakeAddon] }));

      expect(getAddonBySlug(store.getState(), fakeAddon.slug)).toEqual(
        createInternalAddon(fakeAddon),
      );
    });

    it('is case insensitive', () => {
      const slug = 'some-slug';
      const externalAddon = { ...fakeAddon, slug };

      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddonResults({ addons: [externalAddon] }));

      expect(getAddonBySlug(store.getState(), slug.toUpperCase())).toEqual(
        createInternalAddon(externalAddon),
      );
    });
  });

  describe('getAddonByGUID', () => {
    it('returns null if no add-on found with the given guid', () => {
      const { state } = dispatchClientMetadata();

      expect(getAddonByGUID(state, 'guid')).toEqual(null);
    });

    it('returns an add-on by guid', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddonResults({ addons: [fakeAddon] }));

      expect(getAddonByGUID(store.getState(), fakeAddon.guid)).toEqual(
        createInternalAddon(fakeAddon),
      );
    });
  });

  describe('getAllAddons', () => {
    it('returns an empty array when no add-ons are loaded', () => {
      const { state } = dispatchClientMetadata();

      expect(getAllAddons(state)).toEqual([]);
    });

    it('returns an array of add-ons', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddonResults({ addons: [fakeAddon] }));

      expect(getAllAddons(store.getState())).toEqual([
        createInternalAddon(fakeAddon),
      ]);
    });
  });

  describe('isAddonLoading', () => {
    it('returns false for an add-on that has never been fetched or loaded', () => {
      const fetchedSlug = 'some-slug';
      const nonfetchedSlug = 'another-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug: fetchedSlug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, nonfetchedSlug)).toBe(false);
    });

    it('returns true for an add-on that is loading', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, slug)).toBe(true);
    });

    it('is case insensitive', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, slug.toUpperCase())).toBe(true);
    });

    it('returns false when slug is not a string', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, 123)).toBe(false);
    });

    it('returns false when slug is null', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, null)).toBe(false);
    });

    it('returns false when slug is undefined', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, undefined)).toBe(false);
    });

    it('returns false for an add-on that has finished loading', () => {
      const slug = 'some-slug';
      const addonResults = [{ ...fakeAddon, slug }];
      let state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      state = addons(state, loadAddonResults({ addons: addonResults }));

      expect(isAddonLoading({ addons: state }, slug)).toBe(false);
    });
  });

  describe('unloadAddonReviews', () => {
    it('unloads all data for an add-on', () => {
      const guid1 = '1@mozilla.com';
      const id1 = 1;
      // Keep this slug in uppercase to make sure we unload it.
      const slug1 = 'SLUG-1';
      const guid2 = '2@mozilla.com';
      const id2 = 2;
      const slug2 = 'slug-2';
      const addon1 = {
        ...fakeAddon,
        guid: guid1,
        id: id1,
        slug: slug1,
      };
      const addonResults = [
        addon1,
        {
          ...fakeAddon,
          ...fakeAddon,
          guid: guid2,
          id: id2,
          slug: slug2,
        },
      ];
      let state = addons(undefined, loadAddonResults({ addons: addonResults }));

      state = addons(state, unloadAddonReviews({ addonId: id1, reviewId: 1 }));

      expect(state.byGUID[addon1.guid]).toEqual(undefined);
      expect(state.byID[addon1.id]).toEqual(undefined);
      expect(state.bySlug).toEqual({ [slug2]: id2 });
      expect(state.loadingBySlug).toEqual({ [slug2]: false });
    });
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

  describe('addonInfo', () => {
    it('sets a loading flag when fetching info', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddonInfo({ errorHandlerId: 1, slug }),
      );

      expect(isAddonInfoLoading({ state, slug })).toBe(true);
    });

    it('clears info when fetching info', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddonInfo({ errorHandlerId: 1, slug }),
      );

      expect(getAddonInfoBySlug({ slug, state })).toEqual(null);
    });

    it('clears the loading flag when loading info', () => {
      let state;
      const slug = 'some-slug';
      state = addons(state, fetchAddonInfo({ errorHandlerId: 1, slug }));
      state = addons(
        state,
        loadAddonInfo({
          info: fakeAddonInfo,
          slug,
        }),
      );

      expect(isAddonInfoLoading({ slug, state })).toBe(false);
    });

    it('loads info', () => {
      const slug = 'some-slug';
      const info = fakeAddonInfo;
      const state = addons(undefined, loadAddonInfo({ slug, info }));

      expect(getAddonInfoBySlug({ slug, state })).toEqual(
        createInternalAddonInfo(info),
      );
    });

    describe('isAddonInfoLoading', () => {
      it('returns false if info has never been loaded', () => {
        const state = addons(undefined, {
          type: 'SOME_OTHER_ACTION',
        });
        expect(isAddonInfoLoading({ slug: 'some-slug', state })).toBe(false);
      });
    });

    describe('getAddonInfoBySlug', () => {
      it('returns null if no info has been loaded', () => {
        const state = addons(undefined, {
          type: 'SOME_OTHER_ACTION',
        });
        expect(getAddonInfoBySlug({ slug: 'some-slug', state })).toEqual(null);
      });
    });
  });
});
