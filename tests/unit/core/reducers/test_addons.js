import { loadEntities } from 'core/actions';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import addons, {
  denormalizeAddon, fetchAddon, flattenApiAddon, getGuid,
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
      loadEntities(createFetchAddonResult(fakeAddon).entities));
    expect(addons(firstState, { type: 'UNRELATED_ACTION' }))
      .toEqual(firstState);
  });

  it('stores addons from entities', () => {
    const firstState = addons(undefined,
      loadEntities(createFetchAddonResult(fakeAddon).entities));

    const anotherFakeAddon = { ...fakeAddon, slug: 'testing1234', id: 6401 };
    const newState = addons(firstState,
      loadEntities(createFetchAddonResult(anotherFakeAddon).entities));

    expect(newState).toEqual({
      ...firstState,
      [anotherFakeAddon.slug]: denormalizeAddon({
        ...flattenApiAddon(anotherFakeAddon),
        installURL: '',
        isRestartRequired: false,
      }),
    });
  });

  it('stores all add-ons', () => {
    const addonResults = [
      { ...fakeAddon, slug: 'first-slug' },
      { ...fakeAddon, slug: 'second-slug' },
    ];
    const state = addons(undefined,
      loadEntities(createFetchAllAddonsResult(addonResults).entities));
    expect(Object.keys(state).sort())
      .toEqual(['first-slug', 'second-slug']);
  });

  it('stores a modified extension object', () => {
    const extension = { ...fakeAddon, type: ADDON_TYPE_EXTENSION };
    const state = addons(undefined,
      loadEntities(createFetchAddonResult(extension).entities));

    expect(state[extension.slug]).toEqual({
      ...denormalizeAddon(extension),
      installURL: '',
      isRestartRequired: false,
    });
  });

  it('stores a modified theme object', () => {
    const theme = { ...fakeTheme };
    const state = addons(undefined,
      loadEntities(createFetchAddonResult(theme).entities));

    const expectedTheme = {
      ...denormalizeAddon(theme),
      // Expect theme_data to be merged into the addon.
      ...theme.theme_data,
      description: theme.description,
      guid: getGuid(theme),
      installURL: '',
      isRestartRequired: false,
    };
    delete expectedTheme.theme_data;

    expect(state[theme.slug]).toEqual(expectedTheme);
  });

  it('mimics how Firefox appends @persona.mozilla.org to GUIDs', () => {
    const state = addons(undefined,
      loadEntities(createFetchAddonResult(fakeTheme).entities));

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
      loadEntities(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].installURL).toEqual('https://a.m.o/download.xpi');
  });

  it('sets the icon_url as iconUrl', () => {
    const addon = {
      ...fakeAddon,
      icon_url: 'http://foo.com/img.png',
    };
    const state = addons(undefined,
      loadEntities(createFetchAddonResult(addon).entities));
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
      {}, loadEntities(createFetchAddonResult(theme).entities));

    expect(state[theme.slug].description).toBe(null);
  });

  it('exposes `isRestartRequired` attribute from current version files', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(undefined,
      loadEntities(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].isRestartRequired).toBe(true);
  });

  it('sets `isRestartRequired` to `false` when restart is not required', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
      ],
    });

    const state = addons(undefined,
      loadEntities(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `false` when addon has no files', () => {
    const addon = createFakeAddon({ files: [] });

    const state = addons(undefined,
      loadEntities(createFetchAddonResult(addon).entities));
    expect(state[addon.slug].isRestartRequired).toBe(false);
  });

  it('sets `isRestartRequired` to `true` when some files declare it', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    const state = addons(undefined,
      loadEntities(createFetchAddonResult(addon).entities));
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
});
