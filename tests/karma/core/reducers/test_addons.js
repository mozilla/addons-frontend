import addons from 'core/reducers/addons';

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
});
