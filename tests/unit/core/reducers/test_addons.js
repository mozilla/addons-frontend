import { loadEntities } from 'core/actions';
import { ADDON_TYPE_THEME } from 'core/constants';
import addons, { denormalizeAddon } from 'core/reducers/addons';
import { createFetchAddonResult } from 'tests/unit/helpers';
import { fakeAddon } from 'tests/unit/amo/helpers';


describe('addon reducer', () => {
  let addonsState;

  beforeEach(() => {
    const anotherFakeAddon = { ...fakeAddon, slug: 'testing123', id: 64 };

    addonsState = addons({},
      loadEntities(createFetchAddonResult(fakeAddon).entities));
    addonsState = addons(addonsState,
      loadEntities(createFetchAddonResult(anotherFakeAddon).entities));
  });

  it('returns the old state', () => {
    expect(addonsState)
      .toEqual(addons(addonsState, { type: 'UNRELATED_ACTION' }));
  });

  it('stores addons from entities', () => {
    const anotherFakeAddon = { ...fakeAddon, slug: 'testing1234', id: 6401 };

    const newAddonsState = addons(addonsState,
      loadEntities(createFetchAddonResult(anotherFakeAddon).entities));
    expect(newAddonsState).toEqual({
      ...addonsState,
      [anotherFakeAddon.slug]: denormalizeAddon(anotherFakeAddon),
    });
  });

  it('pulls down the install URL from the file', () => {
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
});
