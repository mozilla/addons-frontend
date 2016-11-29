import { clearError, setError } from 'core/actions/errors';
import { SET_ERROR } from 'core/constants';

describe('core/actions/errors', () => {
  describe('setError', () => {
    it('creates an error action', () => {
      const id = 'some-id';
      const error = new Error('some syntax error');
      assert.deepEqual(setError({ id, error }), {
        type: SET_ERROR,
        payload: { error, id },
      });
    });

    it('requires an ID', () => {
      assert.throws(() => {
        setError({ error: new Error('some syntax error') });
      }, /id cannot be empty/);
    });
  });

  describe('clearError', () => {
    it('clears an error', () => {
      const id = 'some-id';
      assert.deepEqual(clearError(id), {
        type: SET_ERROR,
        payload: { id, error: null },
      });
    });
  });
});
