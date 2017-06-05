import discoResults from 'disco/reducers/discoResults';

describe('discoResults reducer', () => {
  it('defaults to an empty array', () => {
    expect(discoResults(undefined, { type: 'UNRELATED' })).toEqual([]);
  });

  it('sets the state to the results', () => {
    const results = ['foo', 'bar'];
    expect(discoResults(['baz'], { type: 'DISCO_RESULTS', payload: { results } })).toBe(results);
  });
});
