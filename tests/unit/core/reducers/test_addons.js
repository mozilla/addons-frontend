import {
  ADDON_TYPE_EXTENSION,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import addons, {
  createInternalAddon,
  fetchAddon,
  getAddonByGUID,
  getAddonByID,
  getAddonBySlug,
  getAllAddons,
  getGuid,
  loadAddons,
  loadAddonResults,
  removeUndefinedProps,
} from 'core/reducers/addons';
import {
  createFetchAddonResult,
  createFetchAllAddonsResult,
  createStubErrorHandler,
} from 'tests/unit/helpers';
import {
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  it('ignores unrelated actions', () => {
    const firstState = addons(
      undefined,
      loadAddons(createFetchAddonResult(fakeAddon).entities),
    );
    expect(addons(firstState, { type: 'UNRELATED_ACTION' })).toEqual(
      firstState,
    );
  });

  it('stores addons from entities', () => {
    const firstState = addons(
      undefined,
      loadAddons(createFetchAddonResult(fakeAddon).entities),
    );

    const anotherFakeAddon = {
      ...fakeAddon,
      slug: 'testing1234',
      id: 6401,
    };
    const newState = addons(
      firstState,
      loadAddons(createFetchAddonResult(anotherFakeAddon).entities),
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
    const state = addons(
      undefined,
      loadAddons(createFetchAllAddonsResult(addonResults).entities),
    );
    expect(Object.keys(state.byID).sort()).toEqual(['123', '456']);
  });

  it('store all add-on slugs with their IDs', () => {
    const addonResults = [
      { ...fakeAddon, slug: 'first-slug', id: 123 },
      { ...fakeAddon, slug: 'second-slug', id: 456 },
    ];
    const state = addons(
      undefined,
      loadAddons(createFetchAllAddonsResult(addonResults).entities),
    );
    expect(state.bySlug).toEqual({
      'first-slug': 123,
      'second-slug': 456,
    });
  });

  it('ignores empty results', () => {
    const addonResults = [];
    const state = addons(
      undefined,
      loadAddons(createFetchAllAddonsResult(addonResults).entities),
    );
    expect(Object.keys(state.byID)).toEqual([]);
  });

  it('stores a modified extension object', () => {
    const extension = { ...fakeAddon, type: ADDON_TYPE_EXTENSION };
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(extension).entities),
    );

    expect(state.byID[extension.id]).toEqual({
      ...extension,
      iconUrl: extension.icon_url,
      platformFiles: {
        [OS_ALL]: fakeAddon.current_version.files[0],
        [OS_ANDROID]: undefined,
        [OS_LINUX]: undefined,
        [OS_MAC]: undefined,
        [OS_WINDOWS]: undefined,
      },
      isRestartRequired: false,
      isWebExtension: true,
      isMozillaSignedExtension: false,
    });
  });

  it('stores a modified theme object', () => {
    const theme = { ...fakeTheme };
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(theme).entities),
    );

    // We manually recreate the theme addon to test that the mapper is doing
    // what we expect it to below.
    const expectedTheme = {
      ...theme,
      // Expect theme_data to be merged into the addon.
      ...theme.theme_data,
      themeData: {
        ...theme.theme_data,
        description: theme.description,
      },
      description: theme.description,
      guid: getGuid(theme),
      iconUrl: theme.icon_url,
      platformFiles: {
        [OS_ALL]: fakeTheme.current_version.files[0],
        [OS_ANDROID]: undefined,
        [OS_LINUX]: undefined,
        [OS_MAC]: undefined,
        [OS_WINDOWS]: undefined,
      },
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
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(theme).entities),
    );

    expect(state.byID[theme.id].id).toEqual(theme.id);
  });

  it('does not store undefined properties', () => {
    const extension = { ...fakeAddon, description: undefined };
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(extension).entities),
    );

    // eslint-disable-next-line no-prototype-builtins
    expect(state.byID[extension.id].hasOwnProperty('description')).toEqual(
      false,
    );
  });

  it('mimics how Firefox appends @persona.mozilla.org to GUIDs', () => {
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(fakeTheme).entities),
    );

    expect(state.byID[fakeTheme.id].guid).toEqual('54321@personas.mozilla.org');
  });

  it('maps platforms to file objects', () => {
    const addon = createFakeAddon({
      files: [
        {
          ...fakeAddon.current_version.files[0],
          platform: OS_MAC,
          url: 'https://a.m.o/mac.xpi',
        },
        {
          ...fakeAddon.current_version.files[0],
          platform: OS_WINDOWS,
          url: 'https://a.m.o/windows.xpi',
        },
        {
          ...fakeAddon.current_version.files[0],
          platform: OS_ALL,
          url: 'https://a.m.o/all.xpi',
        },
      ],
    });
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].platformFiles[OS_ALL].url).toEqual(
      'https://a.m.o/all.xpi',
    );
    expect(state.byID[addon.id].platformFiles[OS_MAC].url).toEqual(
      'https://a.m.o/mac.xpi',
    );
    expect(state.byID[addon.id].platformFiles[OS_WINDOWS].url).toEqual(
      'https://a.m.o/windows.xpi',
    );
  });

  it('handles an empty array of files', () => {
    const addon = createFakeAddon({ files: [] });
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].platformFiles).toMatchObject({
      [OS_ALL]: undefined,
      [OS_ANDROID]: undefined,
      [OS_LINUX]: undefined,
      [OS_MAC]: undefined,
      [OS_WINDOWS]: undefined,
    });
  });

  it('handles files for unknown platforms', () => {
    const addon = createFakeAddon({
      files: [
        {
          platform: 'unexpectedPlatform',
          url: 'https://a.m.o/files/somewhere.xpi',
        },
      ],
    });
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].platformFiles).toMatchObject({
      unexpectedPlatform: {
        ...fakeAddon.current_version.files[0],
        platform: 'unexpectedPlatform',
        url: 'https://a.m.o/files/somewhere.xpi',
      },
    });
  });

  it('sets the icon_url as iconUrl', () => {
    const addon = {
      ...fakeAddon,
      icon_url: 'http://foo.com/img.png',
    };
    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].iconUrl).toEqual(addon.icon_url);
  });

  it('does not use description from theme_data', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/2569
    // Can be removed when
    // https://github.com/mozilla/addons-frontend/issues/1416 is fixed.
    const theme = {
      ...fakeTheme,
      description: null,
      slug: 'baz',
      id: 42,
      theme_data: {
        ...fakeTheme.theme_data,
        description: 'None',
        id: 42,
      },
    };
    const state = addons(
      {},
      loadAddons(createFetchAddonResult(theme).entities),
    );

    expect(state.byID[theme.id].description).toEqual(null);
  });

  it('exposes `isRestartRequired` attribute from current version files', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isRestartRequired).toBe(true);
  });

  it('sets `isRestartRequired` to `false` when restart is not required', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
      ],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `false` when addon has no files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `true` when any file declares it', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isRestartRequired).toBe(true);
  });

  it('exposes `isWebExtension` attribute from current version files', () => {
    const addon = createFakeAddon({
      files: [{ is_webextension: true }],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isWebExtension).toBe(true);
  });

  it('sets `isWebExtension` to `false` when add-on is not a web extension', () => {
    const addon = createFakeAddon({
      files: [{ is_webextension: false }],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isWebExtension).toBe(false);
  });

  it('sets `isWebExtension` to `false` when addon has no files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isWebExtension).toBe(false);
  });

  it('sets `isWebExtension` to `true` when any file declares it', () => {
    const addon = createFakeAddon({
      files: [{ is_webextension: false }, { is_webextension: true }],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isWebExtension).toBe(true);
  });

  it('exposes `isMozillaSignedExtension` from current version files', () => {
    const addon = createFakeAddon({
      files: [{ is_mozilla_signed_extension: true }],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(true);
  });

  it('sets `isMozillaSignedExtension` to `false` when not declared', () => {
    const addon = createFakeAddon({
      files: [{ is_mozilla_signed_extension: false }],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(false);
  });

  it('sets `isMozillaSignedExtension` to `false` without files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(false);
  });

  it('sets `isMozillaSignedExtension` to `true` when any file declares it', () => {
    const addon = createFakeAddon({
      files: [
        { is_mozilla_signed_extension: false },
        { is_mozilla_signed_extension: true },
      ],
    });

    const state = addons(
      undefined,
      loadAddons(createFetchAddonResult(addon).entities),
    );
    expect(state.byID[addon.id].isMozillaSignedExtension).toBe(true);
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
  });

  describe('loadAddons', () => {
    it('requires entities', () => {
      expect(() => loadAddons()).toThrow(/entities parameter cannot be empty/);
    });

    it('allows a missing addons property', () => {
      // This could happen when there are zero results from an API request.
      expect(loadAddons({})).toMatchObject({ payload: { addons: {} } });
    });
  });

  describe('removeUndefinedProps', () => {
    it('removes undefined properties', () => {
      expect(removeUndefinedProps({ thing: undefined })).toEqual({});
    });

    it('preserves falsy properties', () => {
      expect(removeUndefinedProps({ thing: false })).toEqual({ thing: false });
    });

    it('preserves other properties', () => {
      expect(removeUndefinedProps({ thing: 'thing' })).toEqual({
        thing: 'thing',
      });
    });

    it('does not modify the original object', () => {
      const example = { thing: undefined };
      removeUndefinedProps(example);
      expect(example).toEqual({ thing: undefined });
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
      store.dispatch(loadAddons(createFetchAddonResult(fakeAddon).entities));

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

    it('returns an add-on by slug', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddons(createFetchAddonResult(fakeAddon).entities));

      expect(getAddonBySlug(store.getState(), fakeAddon.slug)).toEqual(
        createInternalAddon(fakeAddon),
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
      store.dispatch(loadAddons(createFetchAddonResult(fakeAddon).entities));

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
      store.dispatch(loadAddons(createFetchAddonResult(fakeAddon).entities));

      expect(getAllAddons(store.getState())).toEqual([
        createInternalAddon(fakeAddon),
      ]);
    });
  });
});
