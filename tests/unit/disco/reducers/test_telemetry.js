import telemetry, { setHashedClientId } from 'disco/reducers/telemetry';

describe(__filename, () => {
  it('sets the hashedClientId', () => {
    const hashedClientId = '1112';
    const state = telemetry(undefined, setHashedClientId(hashedClientId));
    expect(state).toEqual({
      hashedClientId,
    });
  });
});
