import addons from 'core/reducers/addons';
import { ADDON_TYPE_THEME } from 'core/constants';

describe('addon reducer', () => {
  let originalState;

  beforeEach(() => {
    originalState = { foo: { slug: 'foo' }, bar: { slug: 'bar' } };
  });

  it('returns the old state', () => {
    expect(originalState).toBe(addons(originalState, { type: 'BLAH' }));
  });

  it('stores addons from entities', () => {
    const state = addons(originalState, {
      payload: {
        entities: {
          addons: {
            baz: { slug: 'baz' },
          },
        },
      },
    });
    expect(state).toEqual({ foo: { slug: 'foo' }, bar: { slug: 'bar' }, baz: { slug: 'baz' } });
  });

  it('pulls down the install URL from the file', () => {
    const fileOne = { url: 'https://a.m.o/download.xpi' };
    const fileTwo = { file: 'data' };
    const addon = {
      slug: 'installable',
      current_version: {
        files: [fileOne, fileTwo],
      },
    };
    expect(
      addons(undefined, { payload: { entities: { addons: { installable: addon } } } })
    ).toEqual({
      installable: {
        ...addon,
        installURL: 'https://a.m.o/download.xpi',
      },
    });
  });

  it('sets the icon_url as iconUrl', () => {
    const addon = {
      slug: 'installable',
      icon_url: 'http://foo.com/img.png',
    };
    expect(
      addons(undefined, { payload: { entities: { addons: { installable: addon } } } })
    ).toEqual({
      installable: {
        ...addon,
        iconUrl: 'http://foo.com/img.png',
      },
    });
  });

  it('flattens theme data', () => {
    const type = ADDON_TYPE_THEME;
    const state = addons(originalState, {
      payload: {
        entities: {
          addons: {
            baz: { slug: 'baz', id: 42, theme_data: { theme_thing: 'some-data' }, type },
          },
        },
      },
    });
    expect(state).toEqual({
      foo: { slug: 'foo' },
      bar: { slug: 'bar' },
      baz: {
        id: 42,
        slug: 'baz',
        theme_thing: 'some-data',
        guid: '42@personas.mozilla.org',
        type: ADDON_TYPE_THEME,
      },
    });
  });
});
