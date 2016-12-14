import { clearError, setError } from 'core/actions/errors';
import { CLEAR_ERROR, SET_ERROR } from 'core/constants';

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

    it('requires an error', () => {
      assert.throws(() => {
        setError({ id: 'some-id' });
      }, /error cannot be empty/);
    });
  });

  describe('clearError', () => {
    it('clears an error', () => {
      const id = 'some-id';
      assert.deepEqual(clearError(id), {
        type: CLEAR_ERROR,
        payload: { id },
      });
    });

    it('requires an ID', () => {
      assert.throws(() => {
        clearError();
      }, /id cannot be empty/);
    });
  });
});
