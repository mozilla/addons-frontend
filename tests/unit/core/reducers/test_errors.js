import { createApiError } from 'core/api/index';
import { clearError, setError } from 'core/actions/errors';
import { API_ERROR_SIGNATURE_EXPIRED, ERROR_UNKNOWN } from 'core/constants';
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
    expect(errors(undefined, { type: 'UNRELATED' })).toEqual(initialState);
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
    expect(state[action.payload.id]).toEqual({
      code: ERROR_UNKNOWN,
      messages: [message],
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

    expect(state.action1.messages[0]).toEqual('action1');
    expect(state.action2.messages[0]).toEqual('action2');
  });

  it('can clear an existing error', () => {
    const id = 'action1';
    let state;
    state = errors(state, setError({ id, error: new Error('action1') }));
    state = errors(state, clearError(id));

    expect(state[id]).toBe(null);
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
    expect(state.action2.messages[0]).toEqual('action2');
  });

  it('stores a generic error', () => {
    const action = setError({ id: 'action1', error: new Error('any message') });
    const state = errors(undefined, action);
    expect(state[action.payload.id]).toEqual({
      code: ERROR_UNKNOWN,
      messages: [],
    });
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
    expect(state[action.payload.id].messages).toEqual(nonFieldErrors);
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

    expect(messages).toContain('username: not long enough');
    expect(messages).toContain('username: contains invalid characters');
    expect(messages).toContain('password: sorry, it cannot be 1234');
  });

  it('stores API responses when they do not have messages', () => {
    // This API error has no messages (hopefully this won't ever happen).
    const action = setError({ id: 'some-id', error: createFakeApiError() });
    const state = errors(undefined, action);
    expect(state[action.payload.id]).toEqual({
      code: ERROR_UNKNOWN,
      messages: [],
    });
  });

  it('adds an error code', () => {
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: {
        code: API_ERROR_SIGNATURE_EXPIRED,
        detail: 'Any message about an expired signature.',
      },
    });
    const action = setError({ id: 'some-id', error });
    const state = errors(undefined, action);
    expect(state[action.payload.id].code).toEqual(API_ERROR_SIGNATURE_EXPIRED);
  });

  it('does not turn an error code into a message', () => {
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: {
        code: API_ERROR_SIGNATURE_EXPIRED,
        detail: 'Some message.',
      },
    });
    const action = setError({ id: 'some-id', error });
    const state = errors(undefined, action);
    expect(state[action.payload.id].messages).toEqual(['Some message.']);
  });
});
