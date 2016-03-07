import addons from 'core/reducers/addons';

describe('addon reducer', () => {
  it('returns the old state', () => {
    const originalState = {foo: {slug: 'foo'}, bar: {slug: 'bar'}};
    assert.strictEqual(originalState, addons(originalState, {type: 'BLAH'}));
  });

  it('adds an addon', () => {
    const originalState = {foo: {slug: 'foo'}};
    const baz = {slug: 'baz'};
    const expectedState = {foo: {slug: 'foo'}, baz};
    const newState = addons(originalState, {type: 'ADDON_FETCHED', addon: baz});
    assert.notStrictEqual(originalState, newState);
    assert.deepEqual(expectedState, newState);
  });
});
