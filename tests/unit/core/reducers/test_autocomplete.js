import { CLIENT_APP_FIREFOX, RECOMMENDED, VERIFIED } from 'core/constants';
import reducer, {
  autocompleteCancel,
  autocompleteLoad,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import { createFakeAutocompleteResult } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { loading, suggestions } = reducer(undefined, {});
      expect(loading).toEqual(false);
      expect(suggestions).toEqual([]);
    });

    it('ignore unrelated actions', () => {
      const state = { loading: false, suggestions: ['foo'] };
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('handles AUTOCOMPLETE_CANCELLED', () => {
      const results = [createFakeAutocompleteResult({ name: 'foo' })];
      const previousState = reducer(undefined, autocompleteLoad({ results }));
      const { loading, suggestions } = reducer(
        previousState,
        autocompleteCancel(),
      );

      expect(loading).toEqual(false);
      expect(suggestions).toEqual([]);
    });

    it('handles AUTOCOMPLETE_STARTED', () => {
      const { loading, suggestions } = reducer(
        undefined,
        autocompleteStart({
          errorHandlerId: 'any-error-handler-id',
          filters: { q: 'search string' },
        }),
      );
      expect(loading).toEqual(true);
      expect(suggestions).toEqual([]);
    });

    it('handles AUTOCOMPLETE_LOADED', () => {
      const results = [
        createFakeAutocompleteResult({ name: 'foo' }),
        createFakeAutocompleteResult({ name: 'bar' }),
        createFakeAutocompleteResult({ name: 'baz' }),
      ];

      const { loading, suggestions } = reducer(
        undefined,
        autocompleteLoad({ results }),
      );

      expect(loading).toBe(false);
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toHaveProperty('name', 'foo');
      expect(suggestions[1]).toHaveProperty('name', 'bar');
      expect(suggestions[2]).toHaveProperty('name', 'baz');
    });

    it('sets the suggestion properties', () => {
      const promoted = { category: RECOMMENDED, apps: [CLIENT_APP_FIREFOX] };
      const result = createFakeAutocompleteResult({
        promoted,
        name: 'baz',
      });
      const results = [result];

      const { loading, suggestions } = reducer(
        undefined,
        autocompleteLoad({ results }),
      );
      expect(loading).toEqual(false);
      expect(suggestions).toEqual([
        {
          addonId: result.id,
          iconUrl: result.icon_url,
          isRecommended: true,
          name: result.name,
          promoted,
          url: result.url,
        },
      ]);
    });

    it('sets the isRecommended to false when the add-on is not recommended', () => {
      const result = createFakeAutocompleteResult({
        promoted: { category: VERIFIED, apps: [CLIENT_APP_FIREFOX] },
        name: 'baz',
      });

      const { suggestions } = reducer(
        undefined,
        autocompleteLoad({ results: [result] }),
      );
      expect(suggestions[0].isRecommended).toEqual(false);
    });

    it('sets the isRecommended to false when the add-on is not promoted', () => {
      const result = createFakeAutocompleteResult({
        promoted: null,
        name: 'baz',
      });

      const { suggestions } = reducer(
        undefined,
        autocompleteLoad({ results: [result] }),
      );
      expect(suggestions[0].isRecommended).toEqual(false);
    });

    it('excludes AUTOCOMPLETE_LOADED results with null names', () => {
      const results = [
        createFakeAutocompleteResult({ name: 'foo' }),
        createFakeAutocompleteResult({ name: null }),
        createFakeAutocompleteResult({ name: 'baz' }),
      ];

      const { loading, suggestions } = reducer(
        undefined,
        autocompleteLoad({ results }),
      );
      expect(loading).toEqual(false);
      expect(suggestions).toHaveLength(2);
    });
  });
});
