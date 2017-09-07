import { ADDON_TYPE_EXTENSION } from 'core/constants';
import addons, {
  createInternalAddon,
  fetchAddon,
  getGuid,
  loadAddons,
  removeUndefinedProps,
} from 'core/reducers/addons';
import {
  createFetchAddonResult,
  createFetchAllAddonsResult,
  createStubErrorHandler,
} from 'tests/unit/helpers';
import {
  createFakeAddon, fakeAddon, fakeTheme,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  it('ignores unrelated actions', () => {
    const firstState = addons(undefined,
      loadAddons(createFetchAddonResult(fakeAddon).entities));
    expect(addons(firstState, { type: 'UNRELATED_ACTION' }))
      .toEqual(firstState);
  });

  it('stores addons from entities', () => {
    const firstState = addons(undefined,
      loadAddons(createFetchAddonResult(fakeAddon).entities));

    const anotherFakeAddon = { ...fakeAddon, slug: 'testing1234', id: 6401 };
    const newState = addons(firstState,
      loadAddons(createFetchAddonResult(anotherFakeAddon).entities));

    expect(newState).toEqual({
      ...firstState,
      [anotherFakeAddon.slug]: {
        ...createInternalAddon(anotherFakeAddon),
        installURL: '',
        isRestartRequired: false,
      },
    });
  });

  it('stores all add-ons', () => {
    const addonResults = [
      { ...fakeAddon, slug: 'first-slug' },
      { ...fakeAddon, slug: 'second-slug' },
    ];
    const state = addons(undefined,
      loadAddons(createFetchAllAddonsResult(addonResults).entities));
    expect(Object.keys(state).sort())
      .toEqual(['first-slug', 'second-slug']);
  });

  it('ignores empty results', () => {
    const addonResults = [];
    const state = addons(undefined,
      loadAddons(createFetchAllAddonsResult(addonResults).entities));
    expect(Object.keys(state)).toEqual([]);
  });

  it('stores a modified extension object', () => {
    const extension = { ...fakeAddon, type: ADDON_TYPE_EXTENSION };
    const state = addons(undefined,
      loadAddons(createFetchAddonResult(extension).entities));

    expect(state[extension.slug]).toEqual({
      ...extension,
      iconUrl: extension.icon_url,
      installURL: '',
      isRestartRequired: false,
    });
  });

  it('stores a modified theme object', () => {
    const theme = { ...fakeTheme };
    const state = addons(undefined,
      loadAddons(createFetchAddonResult(theme).entities));

    const expectedTheme = {
      ...theme,
      // Expect theme_data to be merged into the addon.
      ...theme.theme_data,
      description: theme.description,
      guid: getGuid(theme),
      iconUrl: theme.icon_url,
      installURL: '',
      isRestartRequired: false,
    };
    delete expectedTheme.theme_data;

    expect(state[theme.slug]).toEqual(expectedTheme);
  });

  it('does not let theme_data set properties to undefined', () => {
    const theme = {
      ...fakeTheme,
      theme_data: {
        ...fakeTheme.theme_data,
        id: undefined,
      },
    };
    const state = addons(undefined,
      loadAddons(createFetchAddonResult(theme).entities));

    expect(state[theme.slug].id).toEqual(theme.id);
  });

  it('does not store undefined properties', () => {
    const extension = { ...fakeAddon, description: undefined };
    const state = addons(undefined,
      loadAddons(createFetchAddonResult(extension).entities));

    // eslint-disable-next-line no-prototype-builtins
    expect(state[extension.slug].hasOwnProperty('description'))
      .toEqual(false);
  });

  it('mimics how Firefox appends @persona.mozilla.org to GUIDs', () => {
    const state = addons(undefined,
      loadAddons(createFetchAddonResult(fakeTheme).entities));

    expect(state[fakeTheme.slug].guid)
      .toEqual('54321@personas.mozilla.org');
  });

  it('reads the install URL from the file', () => {
    const addon = {
      ...fakeAddon,
      slug: 'installable',
      current_version: {
        ...fakeAddon.current_version,
        files: [{ url: 'https://a.m.o/download.xpi' }, { file: 'data' }],
      },
    };
    const state = addons(undefined,
      loadAddons(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].installURL).toEqual('https://a.m.o/download.xpi');
  });

  it('sets the icon_url as iconUrl', () => {
    const addon = {
      ...fakeAddon,
      icon_url: 'http://foo.com/img.png',
    };
    const state = addons(undefined,
      loadAddons(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].iconUrl).toEqual(addon.icon_url);
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
      },
    };
    const state = addons(
      {}, loadAddons(createFetchAddonResult(theme).entities));

    expect(state[theme.slug].description).toBe(null);
  });

  it('exposes `isRestartRequired` attribute from current version files', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(undefined,
      loadAddons(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].isRestartRequired).toBe(true);
  });

  it('sets `isRestartRequired` to `false` when restart is not required', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
      ],
    });

    const state = addons(undefined,
      loadAddons(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `false` when addon has no files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(undefined,
      loadAddons(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `true` when any file declares it', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(undefined,
      loadAddons(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].isRestartRequired).toBe(true);
  });

  describe('fetchAddon', () => {
    const defaultParams = Object.freeze({
      slug: 'addon-slug',
      errorHandler: createStubErrorHandler(),
    });

    it('requires an error handler', () => {
      const params = { ...defaultParams };
      delete params.errorHandler;
      expect(() => fetchAddon(params))
        .toThrowError(/errorHandler cannot be empty/);
    });

    it('requires a slug', () => {
      const params = { ...defaultParams };
      delete params.slug;
      expect(() => fetchAddon(params))
        .toThrowError(/slug cannot be empty/);
    });
  });

  describe('loadAddons', () => {
    it('requires entities', () => {
      expect(() => loadAddons())
        .toThrow(/entities parameter cannot be empty/);
    });

    it('allows a missing addons property', () => {
      // This could happen when there are zero results from an API request.
      expect(loadAddons({}))
        .toMatchObject({ payload: { addons: {} } });
    });
  });

  describe('removeUndefinedProps', () => {
    it('removes undefined properties', () => {
      expect(removeUndefinedProps({ thing: undefined })).toEqual({});
    });

    it('preserves falsy properties', () => {
      expect(removeUndefinedProps({ thing: false }))
        .toEqual({ thing: false });
    });

    it('preserves other properties', () => {
      expect(removeUndefinedProps({ thing: 'thing' }))
        .toEqual({ thing: 'thing' });
    });

    it('does not modify the original object', () => {
      const example = { thing: undefined };
      removeUndefinedProps(example);
      expect(example).toEqual({ thing: undefined });
    });
  });
});
