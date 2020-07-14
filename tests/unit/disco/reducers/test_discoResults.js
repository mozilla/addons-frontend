import discoResults, {
  createExternalAddonMap,
  createInternalResult,
  initialState,
  loadDiscoResults,
} from 'disco/reducers/discoResults';
import {
  createDiscoResult,
  createFetchDiscoveryResult,
  fakeDiscoAddon,
} from 'tests/unit/disco/helpers';

describe(__filename, () => {
  it('defaults to an empty array', () => {
    expect(discoResults(undefined, { type: 'UNRELATED' })).toEqual(
      initialState,
    );
  });

  it('loads disco results', () => {
    const result1 = createDiscoResult({
      heading: 'Discovery Addon 1',
      description: 'editorial text',
      addon: {
        ...fakeDiscoAddon,
        guid: '@guid1',
      },
      is_recommendation: false,
    });
    const result2 = createDiscoResult({
      heading: 'Discovery Addon 2',
      description: 'editorial text',
      addon: {
        ...fakeDiscoAddon,
        guid: '@guid2',
      },
      is_recommendation: false,
    });

    const { results } = createFetchDiscoveryResult([result1, result2]);

    const state = discoResults(undefined, loadDiscoResults({ results }));

    expect(state).toMatchObject({
      results: [createInternalResult(result1), createInternalResult(result2)],
    });
    expect(state.hasRecommendations).toEqual(false);
  });

  it('sets `hasRecommendations` to `true` when at least one results comes from the recommendation service', () => {
    const { results } = createFetchDiscoveryResult([
      createDiscoResult({
        addon: { ...fakeDiscoAddon, guid: '@guid1' },
        is_recommendation: false,
      }),
      createDiscoResult({
        addon: { ...fakeDiscoAddon, guid: '@guid2' },
        is_recommendation: true,
      }),
      createDiscoResult({
        addon: { ...fakeDiscoAddon, guid: '@guid3' },
        is_recommendation: false,
      }),
    ]);

    const state = discoResults(undefined, loadDiscoResults({ results }));

    expect(state.hasRecommendations).toEqual(true);
  });

  it('sets `hasRecommendations` to `false` when there is no recommended results', () => {
    const { results } = createFetchDiscoveryResult([
      createDiscoResult({
        addon: { ...fakeDiscoAddon, guid: '@guid1' },
        is_recommendation: false,
      }),
    ]);

    const state = discoResults(undefined, loadDiscoResults({ results }));

    expect(state.hasRecommendations).toEqual(false);
  });

  describe('createInternalResult', () => {
    it('returns an internal result object', () => {
      const discoResult = createDiscoResult();

      expect(createInternalResult(discoResult)).toEqual({
        addonId: discoResult.addon.id,
        description: discoResult.description,
        heading: discoResult.heading,
        isRecommendation: discoResult.is_recommendation,
      });
    });

    it('sets description to null when missing', () => {
      const discoResult = createDiscoResult({
        description: undefined,
      });

      expect(createInternalResult(discoResult)).toMatchObject({
        description: null,
      });
    });
  });

  describe('createExternalAddonMap', () => {
    it('creates a map indexed by add-on slug', () => {
      const addon1 = fakeDiscoAddon;
      const addon2 = {
        ...fakeDiscoAddon,
        slug: 'some-other-slug-for-addon-2',
      };
      const results = [
        createDiscoResult({ addon: addon1 }),
        createDiscoResult({ addon: addon2 }),
      ];

      expect(createExternalAddonMap({ results })).toEqual([addon1, addon2]);
    });

    it('returns an empty map when there is no add-on', () => {
      const results = [];

      expect(createExternalAddonMap({ results })).toEqual([]);
    });
  });
});
