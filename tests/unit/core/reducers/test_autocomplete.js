import reducer, {
  autocompleteCancel,
  autocompleteLoad,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import { createFakeAutocompleteResult } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { loading, suggestions } = reducer(undefined);
      expect(loading).toBe(false);
      expect(suggestions).toEqual([]);
    });

    it('ignore unrelated actions', () => {
      const state = { loading: false, suggestions: ['foo'] };
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('handles AUTOCOMPLETE_CANCELLED', () => {
      const { loading, suggestions } = reducer(undefined, autocompleteCancel());
      expect(loading).toBe(false);
      expect(suggestions).toEqual([]);
    });

    it('handles AUTOCOMPLETE_STARTED', () => {
      const { loading, suggestions } = reducer(undefined, autocompleteStart({
        errorHandlerId: 'any-error-handler-id',
        filters: { q: 'search string' },
      }));
      expect(loading).toBe(true);
      expect(suggestions).toEqual([]);
    });

    it('handles AUTOCOMPLETE_LOADED', () => {
      const results = [
        createFakeAutocompleteResult({ name: 'foo' }),
        createFakeAutocompleteResult({ name: 'bar' }),
        createFakeAutocompleteResult({ name: 'baz' }),
      ];

      const {
        loading,
        isOpen,
        suggestions,
      } = reducer(undefined, autocompleteLoad({ results }));

      expect(loading).toBe(false);
      expect(isOpen).toEqual(true);
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toHaveProperty('name', 'foo');
      expect(suggestions[1]).toHaveProperty('name', 'bar');
      expect(suggestions[2]).toHaveProperty('name', 'baz');
    });

    it('sets isOpen to false if no suggestions are found', () => {
      const results = [];
      const { isOpen } = reducer(undefined, autocompleteLoad({ results }));

      expect(isOpen).toEqual(false);
    });

    it('sets the icon_url as iconUrl', () => {
      const result = createFakeAutocompleteResult({ name: 'baz' });
      const results = [result];

      const { loading, suggestions } = reducer(undefined, autocompleteLoad({ results }));
      expect(loading).toBe(false);
      expect(suggestions).toEqual([
        {
          name: result.name,
          url: result.url,
          iconUrl: result.icon_url,
        },
      ]);
    });

    it('excludes AUTOCOMPLETE_LOADED results with null names', () => {
      const results = [
        createFakeAutocompleteResult({ name: 'foo' }),
        createFakeAutocompleteResult({ name: null }),
        createFakeAutocompleteResult({ name: 'baz' }),
      ];

      const { loading, suggestions } = reducer(undefined, autocompleteLoad({ results }));
      expect(loading).toBe(false);
      expect(suggestions).toHaveLength(2);
    });
  });

  describe('autocompleteStart()', () => {
    it('throws an error if arguments are missing', () => {
      expect(() => {
        autocompleteStart({});
      }).toThrow(/errorHandlerId is required/);
      expect(() => {
        autocompleteStart({ errorHandlerId: 'id' });
      }).toThrow(/filters are required/);
    });
  });

  describe('autocompleteLoad()', () => {
    it('throws an error if arguments are missing', () => {
      expect(() => {
        autocompleteLoad({});
      }).toThrow(/results are required/);
    });
  });
});
