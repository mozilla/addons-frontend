import users from 'core/reducers/users';

describe('users reducer', () => {
  let originalState;

  beforeEach(() => {
    originalState = { foo: { username: 'foo' }, bar: { username: 'bar' } };
  });

  it('returns the old state', () => {
    expect(originalState).toBe(users(originalState, { type: 'BLAH' }));
  });

  it('stores users from entities', () => {
    const state = users(originalState, {
      payload: {
        entities: {
          users: {
            baz: { username: 'baz' },
          },
        },
      },
    });
    expect(state).toEqual(
      { foo: { username: 'foo' }, bar: { username: 'bar' }, baz: { username: 'baz' } }
    );
  });
});
