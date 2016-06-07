import addons from 'core/reducers/addons';
import { API_THEME_TYPE, THEME_TYPE } from 'disco/constants';

describe('addon reducer', () => {
  let originalState;

  beforeEach(() => {
    originalState = {foo: {slug: 'foo'}, bar: {slug: 'bar'}};
  });

  it('returns the old state', () => {
    assert.strictEqual(originalState, addons(originalState, {type: 'BLAH'}));
  });

  it('stores addons from entities', () => {
    const state = addons(originalState, {
      payload: {
        entities: {
          addons: {
            baz: {slug: 'baz'},
          },
        },
      },
    });
    assert.deepEqual(state, {foo: {slug: 'foo'}, bar: {slug: 'bar'}, baz: {slug: 'baz'}});
  });

  it('pulls down the install URL from the file', () => {
    const fileOne = {url: 'https://a.m.o/download.xpi'};
    const fileTwo = {file: 'data'};
    const addon = {
      slug: 'installable',
      current_version: {
        files: [fileOne, fileTwo],
      },
    };
    assert.deepEqual(
      addons(undefined, {payload: {entities: {addons: {installable: addon}}}}),
      {
        installable: {
          ...addon,
          installURL: 'https://a.m.o/download.xpi',
        },
      });
  });

  it('flattens theme data', () => {
    const type = API_THEME_TYPE;
    const state = addons(originalState, {
      payload: {
        entities: {
          addons: {
            baz: {slug: 'baz', id: 42, theme_data: {theme_thing: 'some-data'}, type},
          },
        },
      },
    });
    assert.deepEqual(
      state,
      {
        foo: {slug: 'foo'},
        bar: {slug: 'bar'},
        baz: {
          id: 42,
          slug: 'baz',
          theme_thing: 'some-data',
          guid: '42@personas.mozilla.org',
          type: THEME_TYPE,
        },
      });
  });
});
