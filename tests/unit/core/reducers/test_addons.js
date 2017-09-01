import { loadEntities } from 'core/actions';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import addons, {
  denormalizeAddon, fetchAddon, getGuid,
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
        ...anotherFakeAddon,
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
      ...theme.theme_data,
      description: theme.description,
      guid: getGuid(theme),
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

    expect(
      addons(undefined, loadEntities(createFetchAddonResult(addon).entities))
    ).toEqual({
      installable: denormalizeAddon({
        ...addon,
        installURL: 'https://a.m.o/download.xpi',
        isRestartRequired: false,
      }),
    });
  });

  it('sets the icon_url as iconUrl', () => {
    const addon = {
      ...fakeAddon,
      slug: 'installable',
      icon_url: 'http://foo.com/img.png',
    };

    expect(
      addons(undefined, loadEntities(createFetchAddonResult(addon).entities))
    ).toEqual({
      installable: {
        ...addon,
        iconUrl: addon.icon_url,
        installURL: '',
        isRestartRequired: false,
      },
    });
  });

  it('flattens theme data', () => {
    const theme = {
      ...fakeAddon,
      slug: 'baz',
      id: 42,
      theme_data: { theme_thing: 'some-data' },
      type: ADDON_TYPE_THEME,
    };
    const state = addons(
      {}, loadEntities(createFetchAddonResult(theme).entities));

    expect(state).toMatchObject({
      baz: { theme_thing: 'some-data' },
    });
  });

  it('does not use description from theme_data', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/2569
    // Can be removed when
    // https://github.com/mozilla/addons-frontend/issues/1416 is fixed.
    const theme = {
      ...fakeAddon,
      description: null,
      slug: 'baz',
      id: 42,
      theme_data: { theme_thing: 'some-data', description: 'None' },
      type: ADDON_TYPE_THEME,
    };
    const state = addons(
      {}, loadEntities(createFetchAddonResult(theme).entities));

    expect(state).toMatchObject({
      baz: { description: null },
    });
  });

  it('exposes `isRestartRequired` attribute from current version files', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    expect(
      addons(undefined, loadEntities(createFetchAddonResult(addon).entities))
    ).toEqual({
      [addon.slug]: denormalizeAddon({
        ...addon,
        installURL: '',
        isRestartRequired: true,
      }),
    });
  });

  it('sets `isRestartRequired` to `false` when restart is not required', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
      ],
    });

    expect(
      addons(undefined, loadEntities(createFetchAddonResult(addon).entities))
    ).toEqual({
      [addon.slug]: denormalizeAddon({
        ...addon,
        installURL: '',
        isRestartRequired: false,
      }),
    });
  });

  it('sets `isRestartRequired` to `false` when addon has no files', () => {
    const addon = createFakeAddon({ files: [] });

    expect(
      addons(undefined, loadEntities(createFetchAddonResult(addon).entities))
    ).toEqual({
      [addon.slug]: denormalizeAddon({
        ...addon,
        isRestartRequired: false,
      }),
    });
  });

  it('sets `isRestartRequired` to `true` when some files declare it', () => {
    const addon = createFakeAddon({
      files: [
        { ...fakeAddon.current_version.files[0], is_restart_required: false },
        { ...fakeAddon.current_version.files[0], is_restart_required: true },
      ],
    });

    expect(
      addons(undefined, loadEntities(createFetchAddonResult(addon).entities))
    ).toEqual({
      [addon.slug]: denormalizeAddon({
        ...addon,
        installURL: '',
        isRestartRequired: true,
      }),
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
