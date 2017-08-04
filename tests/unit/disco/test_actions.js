import { getDiscoResults } from 'disco/actions';

describe('disco/actions/getDiscoResults', () => {
  function defaultParams() {
    return { errorHandlerId: 'some-id' };
  }

  it('requires an error handler ID', () => {
    const params = defaultParams();
    delete params.errorHandlerId;
    expect(() => getDiscoResults(params))
      .toThrow(/errorHandlerId is required/);
  });

  it('adds errorHandlerId to the payload', () => {
    const params = defaultParams();
    const action = getDiscoResults(params);
    expect(action.payload.errorHandlerId).toEqual(params.errorHandlerId);
  });
});
