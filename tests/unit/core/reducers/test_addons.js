import { loadEntities } from 'core/actions';
import { ADDON_TYPE_THEME } from 'core/constants';
import addons, { denormalizeAddon, fetchAddon } from 'core/reducers/addons';
import {
  createFetchAddonResult,
  createStubErrorHandler,
} from 'tests/unit/helpers';
import { createFakeAddon, fakeAddon } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  let addonsState;

  beforeEach(() => {
    const anotherFakeAddon = { ...fakeAddon, slug: 'testing123', id: 64 };

    addonsState = addons(
      {},
      loadEntities(createFetchAddonResult(fakeAddon).entities)
    );
    addonsState = addons(
      addonsState,
      loadEntities(createFetchAddonResult(anotherFakeAddon).entities)
    );
  });

  it('returns the old state', () => {
    expect(addonsState).toEqual(
      addons(addonsState, { type: 'UNRELATED_ACTION' })
    );
  });

  it('stores addons from entities', () => {
    const anotherFakeAddon = { ...fakeAddon, slug: 'testing1234', id: 6401 };

    const newAddonsState = addons(
      addonsState,
      loadEntities(createFetchAddonResult(anotherFakeAddon).entities)
    );
    expect(newAddonsState).toEqual({
      ...addonsState,
      [anotherFakeAddon.slug]: denormalizeAddon({
        ...anotherFakeAddon,
        installURL: '',
        isRestartRequired: false,
      }),
    });
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
      {},
      loadEntities(createFetchAddonResult(theme).entities)
    );

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
      {},
      loadEntities(createFetchAddonResult(theme).entities)
    );

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

  it('sets `isRestartRequired` to `false` when addon does not need restart', () => {
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

  it('sets `isRestartRequired` to `false` when addon does not have any files', () => {
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

  it('sets `isRestartRequired` to `true` when at least one of the files declares it', () => {
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
      expect(() => fetchAddon(params)).toThrowError(
        /errorHandler cannot be empty/
      );
    });

    it('requires a slug', () => {
      const params = { ...defaultParams };
      delete params.slug;
      expect(() => fetchAddon(params)).toThrowError(/slug cannot be empty/);
    });
  });
});
