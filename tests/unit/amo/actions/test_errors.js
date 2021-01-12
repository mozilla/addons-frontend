import { clearError, setError, setErrorMessage } from 'amo/actions/errors';
import { CLEAR_ERROR, SET_ERROR } from 'amo/constants';

describe(__filename, () => {
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
      }).toThrowError(/id cannot be empty/);
    });

    it('requires an error', () => {
      expect(() => {
        setError({ id: 'some-id' });
      }).toThrowError(/error cannot be empty/);
    });
  });

  describe('setErrorMessage', () => {
    const defaultParams = () => {
      return {
        id: 'some-error-id',
        message: 'Some message',
      };
    };

    it('requires an ID', () => {
      const params = defaultParams();
      delete params.id;

      expect(() => setErrorMessage(params)).toThrow(/id cannot be empty/);
    });

    it('requires a message', () => {
      const params = defaultParams();
      delete params.message;

      expect(() => setErrorMessage(params)).toThrow(/message cannot be empty/);
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
      }).toThrowError(/id cannot be empty/);
    });
  });
});
