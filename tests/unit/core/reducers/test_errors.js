import { createApiError } from 'core/api/index';
import { clearError, setError, setErrorMessage } from 'core/actions/errors';
import {
  API_ERROR_SIGNATURE_EXPIRED,
  ERROR_ADDON_DISABLED_BY_ADMIN,
  ERROR_ADDON_DISABLED_BY_DEV,
  ERROR_UNKNOWN,
} from 'core/constants';
import errors, { initialState } from 'core/reducers/errors';

// eslint-disable-next-line jest/no-export
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
    response,
    jsonResponse: data,
    apiURL: '/some/url/',
  });
}

const getReducedError = (error) => {
  const action = setError({ id: 'some-id', error });
  const state = errors(undefined, action);

  const reducedError = state[action.payload.id];
  expect(reducedError).toBeDefined();
  return reducedError;
};

describe(__filename, () => {
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
    expect(getReducedError(error)).toEqual({
      code: ERROR_UNKNOWN,
      messages: [message],
      responseStatusCode: 401,
    });
  });

  it('preserves existing errors', () => {
    const action1 = setError({
      id: 'action1',
      error: createFakeApiError({ nonFieldErrors: ['action1'] }),
    });
    const action2 = setError({
      id: 'action2',
      error: createFakeApiError({ nonFieldErrors: ['action2'] }),
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
    state = errors(
      state,
      setError({
        id: 'action1',
        error: createFakeApiError({ nonFieldErrors: ['action1'] }),
      }),
    );
    state = errors(
      state,
      setError({
        id: 'action2',
        error: createFakeApiError({ nonFieldErrors: ['action2'] }),
      }),
    );
    state = errors(state, clearError('action1'));

    // Make sure the other error was not cleared.
    expect(state.action2.messages[0]).toEqual('action2');
  });

  it('stores a generic error', () => {
    expect(getReducedError(new Error('any message'))).toEqual({
      code: ERROR_UNKNOWN,
      messages: [],
      responseStatusCode: null,
    });
  });

  it('gets non_field_errors from API error response', () => {
    const nonFieldErrors = [
      'both user_id and password cannot be blank',
      'some other message',
    ];
    const reducedError = getReducedError(
      createFakeApiError({ nonFieldErrors }),
    );
    expect(reducedError.messages).toEqual(nonFieldErrors);
  });

  it('gets field errors from API error response', () => {
    const fieldErrors = {
      username: ['not long enough', 'contains invalid characters'],
      password: ['sorry, it cannot be 1234'],
    };
    const reducedError = getReducedError(createFakeApiError({ fieldErrors }));
    const { messages } = reducedError;

    expect(messages).toContain('not long enough');
    expect(messages).toContain('contains invalid characters');
    expect(messages).toContain('sorry, it cannot be 1234');
  });

  it('stores API responses when they do not have messages', () => {
    // This API error has no messages (hopefully this won't ever happen).
    expect(getReducedError(createFakeApiError())).toMatchObject({
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
    expect(getReducedError(error).code).toEqual(API_ERROR_SIGNATURE_EXPIRED);
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
    expect(getReducedError(error).messages).toEqual(['Some message.']);
  });

  it('can capture an error about add-ons disabled by the developer', () => {
    const message = 'Authentication credentials were not provided.';
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: {
        detail: message,
        is_disabled_by_developer: true,
        is_disabled_by_mozilla: false,
      },
    });
    expect(getReducedError(error)).toEqual({
      code: ERROR_ADDON_DISABLED_BY_DEV,
      messages: [message],
      responseStatusCode: 401,
    });
  });

  it('can capture an error about add-ons disabled by an admin', () => {
    const message = 'Authentication credentials were not provided.';
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: {
        detail: message,
        is_disabled_by_developer: false,
        is_disabled_by_mozilla: true,
      },
    });
    expect(getReducedError(error)).toEqual({
      code: ERROR_ADDON_DISABLED_BY_ADMIN,
      messages: [message],
      responseStatusCode: 401,
    });
  });

  it('adds nested error messages', () => {
    const nested = { inner: 'This is a nested message.' };
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      // Nested responses might happen if we don't map the
      // real API response correctly. We should at least store them.
      jsonResponse: { nested },
    });
    expect(getReducedError(error).messages).toEqual([nested]);
  });

  it('ignores unknown error keys', () => {
    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      // There is no way to guess what this is so we just ignore it.
      jsonResponse: { unknown_key: true },
    });
    expect(getReducedError(error).messages).toEqual([]);
  });

  it('stores a message in state', () => {
    const id = 'some-id';
    const message = 'Form field cannot be blank';
    const action = setErrorMessage({ id, message });
    const state = errors(undefined, action);

    expect(state[id].messages).toEqual([message]);
  });

  it('handles setting multiple messages', () => {
    const id = 'some-id';

    let state = errors(
      undefined,
      setErrorMessage({
        id,
        message: 'first',
      }),
    );
    state = errors(
      state,
      setErrorMessage({
        id,
        message: 'second',
      }),
    );

    expect(state[id].messages).toEqual(['first', 'second']);
  });
});
