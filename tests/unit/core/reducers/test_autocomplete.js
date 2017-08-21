import reducer, {
  autocompleteCancel,
  autocompleteLoad,
  autocompleteStart,
  AUTOCOMPLETE_STARTED,
  AUTOCOMPLETE_LOADED,
} from 'core/reducers/autocomplete';
import { createFakeAutocompleteResult } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { loading, suggestions } = reducer(undefined);
      expect(loading).toBe(false);
      expect(suggestions).toEqual([]);
    });

    it('handles AUTOCOMPLETE_CANCELLED', () => {
      const { loading, suggestions } = reducer(undefined, autocompleteCancel());
      expect(loading).toBe(false);
      expect(suggestions).toEqual([]);
    });

    it('handles AUTOCOMPLETE_STARTED', () => {
      const { loading, suggestions } = reducer(undefined, { type: AUTOCOMPLETE_STARTED });
      expect(loading).toBe(true);
      expect(suggestions).toEqual([]);
    });

    it('handles AUTOCOMPLETE_LOADED', () => {
      const payload = {
        results: [
          createFakeAutocompleteResult({ name: 'foo' }),
          createFakeAutocompleteResult({ name: 'bar' }),
          createFakeAutocompleteResult({ name: 'baz' }),
        ],
      };

      const { loading, suggestions } = reducer(undefined, {
        type: AUTOCOMPLETE_LOADED,
        payload,
      });
      expect(loading).toBe(false);
      expect(suggestions).toEqual(['foo', 'bar', 'baz']);
    });

    it('excludes AUTOCOMPLETE_LOADED results with null names', () => {
      const payload = {
        results: [
          createFakeAutocompleteResult({ name: 'foo' }),
          createFakeAutocompleteResult({ name: null }),
          createFakeAutocompleteResult({ name: 'baz' }),
        ],
      };

      const { loading, suggestions } = reducer(undefined, {
        type: AUTOCOMPLETE_LOADED,
        payload,
      });
      expect(loading).toBe(false);
      expect(suggestions).toEqual(['foo', 'baz']);
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

    it('constructs the AUTOCOMPLETE_STARTED action', () => {
      const payload = {
        errorHandlerId: 'id',
        filters: {},
      };
      expect(autocompleteStart(payload)).toEqual({
        type: AUTOCOMPLETE_STARTED,
        payload,
      });
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
