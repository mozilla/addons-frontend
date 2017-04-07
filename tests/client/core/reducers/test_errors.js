import { createApiError } from 'core/api/index';
import { clearError, setError } from 'core/actions/errors';
import errors, { initialState } from 'core/reducers/errors';

export function createFakeApiError({ fieldErrors = {}, nonFieldErrors } = {}) {
  const response = {
    ok: false,
    status: 400,
  };

  const data = fieldErrors;
  if (nonFieldErrors) {
    data.non_field_errors = nonFieldErrors;
  }

  return createApiError({
    response, jsonResponse: data, apiURL: '/some/url/',
  });
}

describe('errors reducer', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(errors(undefined, { type: 'UNRELATED' }), initialState);
  });

  it('stores a simple error', () => {
    const error = new Error('some message');
    const action = setError({ id: 'some-id', error });
    const state = errors(undefined, action);
    assert.deepEqual(state[action.payload.id], {
      messages: ['An unexpected error occurred'],
      needsPageRefresh: false,
    });
  });

  it('handles API object responses', () => {
    const message = 'Authentication credentials were not provided.';
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { detail: message },
    });
    const action = setError({ id: 'some-id', error });
    const state = errors(undefined, action);
    assert.deepEqual(state[action.payload.id], {
      messages: [message],
      needsPageRefresh: false,
    });
  });

  it('preserves existing errors', () => {
    const action1 = setError({
      id: 'action1', error: createFakeApiError({ nonFieldErrors: ['action1'] }),
    });
    const action2 = setError({
      id: 'action2', error: createFakeApiError({ nonFieldErrors: ['action2'] }),
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
    state = errors(state, clearError(id));

    assert.strictEqual(state[id], null);
  });

  it('only clears a single error', () => {
    let state;
    state = errors(state, setError({
      id: 'action1',
      error: createFakeApiError({ nonFieldErrors: ['action1'] }),
    }));
    state = errors(state, setError({
      id: 'action2',
      error: createFakeApiError({ nonFieldErrors: ['action2'] }),
    }));
    state = errors(state, clearError('action1'));

    // Make sure the other error was not cleared.
    assert.equal(state.action2.messages[0], 'action2');
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
      error: createFakeApiError({ nonFieldErrors }),
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
      error: createFakeApiError({ fieldErrors }),
    });

    const state = errors(undefined, action);
    const messages = state[action.payload.id].messages;

    assert.include(messages, 'username: not long enough');
    assert.include(messages, 'username: contains invalid characters');
    assert.include(messages, 'password: sorry, it cannot be 1234');
  });

  it('handles API responses without any messages', () => {
    // This API error has no messages (hopefully this won't ever happen).
    const action = setError({ id: 'some-id', error: createFakeApiError() });
    const state = errors(undefined, action);
    assert.deepEqual(state[action.payload.id], {
      messages: ['An unexpected error occurred'],
      needsPageRefresh: false,
    });
  });

  it('adds a needs-refresh flag for expired signature errors', () => {
    const message = 'Signature has expired.';
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { detail: message },
    });
    const action = setError({ id: 'some-id', error });
    const state = errors(undefined, action);
    assert.strictEqual(state[action.payload.id].needsPageRefresh, true);
  });
});
