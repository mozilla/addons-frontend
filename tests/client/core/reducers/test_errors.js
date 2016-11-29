import { setError } from 'core/actions/errors';
import errors, { initialState } from 'core/reducers/errors';

describe('errors reducer', () => {
  function createApiError({ fieldErrors = {}, nonFieldErrors } = {}) {
    const response = {
      ok: false,
      status: 400,
    };

    const data = fieldErrors;
    if (nonFieldErrors) {
      data.non_field_errors = nonFieldErrors;
    }

    const apiError = new Error('Error calling API');
    apiError.response = {
      apiURL: '/some/url',
      status: response.status,
      data,
    };

    return apiError;
  }

  it('defaults to an empty object', () => {
    assert.deepEqual(errors(undefined, { type: 'UNRELATED' }), initialState);
  });

  it('stores a simple error', () => {
    const error = new Error('some message');
    const action = setError({ id: 'some-id', error });
    const state = errors(undefined, action);
    assert.deepEqual(state[action.payload.id], {
      messages: ['An unexpected error occurred'],
    });
  });

  it('preserves existing errors', () => {
    const action1 = setError({
      id: 'action1', error: createApiError({ nonFieldErrors: ['action1'] }),
    });
    const action2 = setError({
      id: 'action2', error: createApiError({ nonFieldErrors: ['action2'] }),
    });

    let state;
    state = errors(state, action1);
    state = errors(state, action2);

    assert.equal(state.action1.messages[0], 'action1');
    assert.equal(state.action2.messages[0], 'action2');
  });

  it('can clear an existing error', () => {
    const id = 'action1';
    let state;
    state = errors(state, setError({ id, error: new Error('action1') }));
    state = errors(state, setError({ id, error: null }));

    assert.strictEqual(state[id], null);
  });

  it('creates a default error message', () => {
    const action = setError({ id: 'action1', error: new Error('any message') });
    const state = errors(undefined, action);
    assert.deepEqual(state[action.payload.id].messages,
                     ['An unexpected error occurred']);
  });

  it('gets non_field_errors from API error response', () => {
    const nonFieldErrors = [
      'both user_id and password cannot be blank',
      'some other message',
    ];
    const action = setError({
      id: 'action1',
      error: createApiError({ nonFieldErrors }),
    });
    const state = errors(undefined, action);
    assert.deepEqual(state[action.payload.id].messages, nonFieldErrors);
  });

  it('gets field errors from API error response', () => {
    const fieldErrors = {
      username: ['not long enough', 'contains invalid characters'],
      password: ['sorry, it cannot be 1234'],
    };
    const action = setError({
      id: 'action1',
      error: createApiError({ fieldErrors }),
    });

    const state = errors(undefined, action);
    const messages = state[action.payload.id].messages;

    assert.include(messages, 'username: not long enough');
    assert.include(messages, 'username: contains invalid characters');
    assert.include(messages, 'password: sorry, it cannot be 1234');
  });

  it('handles API responses without any messages', () => {
    // This API error has no messages (hopefully this won't ever happen).
    const action = setError({ id: 'some-id', error: createApiError() });
    const state = errors(undefined, action);
    assert.deepEqual(state[action.payload.id], {
      messages: ['An unexpected error occurred'],
    });
  });
});
