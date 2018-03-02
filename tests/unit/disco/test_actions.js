import { getDiscoResults, loadDiscoResults } from 'disco/actions';
import {
  createFetchDiscoveryResult, fakeDiscoAddon,
} from 'tests/unit/disco/helpers';

describe('disco/actions/loadDiscoResults', () => {
  function defaultParams() {
    const addon = {
      heading: 'Discovery Addon',
      description: 'editorial text',
      addon: fakeDiscoAddon,
    };
    const { entities, result } = createFetchDiscoveryResult([addon]);
    return { entities, result };
  }

  it('requires an entities param', () => {
    const params = defaultParams();
    delete params.entities;
    expect(() => loadDiscoResults(params))
      .toThrow(/entities parameter is required/);
  });

  it('requires a result param', () => {
    const params = defaultParams();
    delete params.result;
    expect(() => loadDiscoResults(params))
      .toThrow(/result parameter is required/);
  });
});

describe('disco/actions/getDiscoResults', () => {
  function defaultParams() {
    return {
      errorHandlerId: 'some-id',
      taarParams: {
        platform: 'Darwin',
        'telemetry-client-id': 'client-id',
      },
    };
  }

  it('requires errorHandlerId', () => {
    const params = defaultParams();
    delete params.errorHandlerId;
    expect(() => {
      getDiscoResults(params);
    }).toThrow(/errorHandlerId is required/);
  });

  it('requires taarParams.platform', () => {
    const params = defaultParams();
    delete params.taarParams.platform;
    expect(() => {
      getDiscoResults(params);
    }).toThrow(/taarParams\.platform is required/);
  });

  it('adds errorHandlerId to the payload', () => {
    const params = defaultParams();
    const action = getDiscoResults(params);
    expect(action.payload.errorHandlerId).toEqual(params.errorHandlerId);
  });
});
