import { clearError, setError } from 'core/actions/errors';
import { CLEAR_ERROR, SET_ERROR } from 'core/constants';

describe('core/actions/errors', () => {
  describe('setError', () => {
    it('creates an error action', () => {
      const id = 'some-id';
      const error = new Error('some syntax error');
      expect(setError({ id, error })).toEqual({
        type: SET_ERROR,
        payload: { error, id },
      });
    });

    it('requires an ID', () => {
      expect(() => {
        setError({ error: new Error('some syntax error') });
      }).toThrow();
    });

    it('requires an error', () => {
      expect(() => {
        setError({ id: 'some-id' });
      }).toThrow();
    });
  });

  describe('clearError', () => {
    it('clears an error', () => {
      const id = 'some-id';
      expect(clearError(id)).toEqual({
        type: CLEAR_ERROR,
        payload: { id },
      });
    });

    it('requires an ID', () => {
      expect(() => {
        clearError();
      }).toThrow();
    });
  });
});
