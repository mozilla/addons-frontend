import discoResults from 'disco/reducers/discoResults';

describe('discoResults reducer', () => {
  it('defaults to an empty array', () => {
    assert.deepEqual(discoResults(undefined, { type: 'UNRELATED' }), []);
  });

  it('sets the state to the results', () => {
    const results = ['foo', 'bar'];
    assert.strictEqual(
      discoResults(['baz'], { type: 'DISCO_RESULTS', payload: { results } }),
      results);
  });
});
