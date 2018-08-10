import { loadDiscoResults } from 'disco/actions';
import discoResults from 'disco/reducers/discoResults';
import {
  createFetchDiscoveryResult,
  fakeDiscoAddon,
} from 'tests/unit/disco/helpers';

describe(__filename, () => {
  it('defaults to an empty array', () => {
    expect(discoResults(undefined, { type: 'UNRELATED' })).toEqual([]);
  });

  it('sets the state to the results', () => {
    const addon1 = {
      heading: 'Discovery Addon 1',
      description: 'editorial text',
      addon: {
        ...fakeDiscoAddon,
        guid: '@guid1',
      },
    };
    const addon2 = {
      heading: 'Discovery Addon 1',
      description: 'editorial text',
      addon: {
        ...fakeDiscoAddon,
        guid: '@guid2',
      },
    };
    const { entities, result } = createFetchDiscoveryResult([addon1, addon2]);

    const state = discoResults(
      undefined,
      loadDiscoResults({ entities, result }),
    );

    expect(state).toEqual([
      {
        heading: addon1.heading,
        description: addon1.description,
        addon: addon1.addon.guid,
      },
      {
        heading: addon2.heading,
        description: addon2.description,
        addon: addon2.addon.guid,
      },
    ]);
  });
});
