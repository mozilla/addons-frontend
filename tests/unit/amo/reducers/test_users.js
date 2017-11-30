import reducer, {
  FETCH_USER_ACCOUNT,
  LOAD_USER_ACCOUNT,
  fetchUserAccount,
  initialState,
  loadUserAccount,
} from 'amo/reducers/users';
import {
  createStubErrorHandler,
  createUserAccountResponse,
} from 'tests/unit/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { byID, byUsername } = reducer(undefined, { type: 'NONE' });
      expect(byID).toEqual({});
      expect(byUsername).toEqual({});
    });

    it('ignores unrelated actions', () => {
      const state = reducer(undefined, loadUserAccount({
        user: createUserAccountResponse({ id: 12345, username: 'john' }),
      }));
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('fetchUserAccount returns payload and type', () => {
      const errorHandlerId = createStubErrorHandler().id;
      const { payload, type } = fetchUserAccount({
        errorHandlerId,
        username: 'Hulk',
      });

      expect(type).toEqual(FETCH_USER_ACCOUNT);
      expect(payload.errorHandlerId).toEqual(errorHandlerId);
      expect(payload.username).toEqual('Hulk');
    });

    it('throws when no errorHandlerId is passed to fetchUserAccount', () => {
      expect(() => {
        fetchUserAccount({ username: 'Cool Kat' });
      }).toThrowError('errorHandlerId is required');
    });

    it('throws when no username is passed to fetchUserAccount', () => {
      const errorHandlerId = createStubErrorHandler().id;
      expect(() => {
        fetchUserAccount({ errorHandlerId });
      }).toThrowError('username is required');
    });

    it('handles false-y display_name', () => {
      const state = reducer(initialState, loadUserAccount({
        user: createUserAccountResponse({
          // The `createUserAccountResponse` helper converts displayName to
          // display_name, which is the actual property the API returns.
          displayName: null,
          id: 40,
          username: 'john',
        }),
      }));

      expect(state.byID[40].displayName).toEqual('john');
    });

    it('handles zero-length display_name', () => {
      const state = reducer(initialState, loadUserAccount({
        user: createUserAccountResponse({
          // The `createUserAccountResponse` helper converts displayName to
          // display_name, which is the actual property the API returns.
          displayName: '',
          id: 40,
          username: 'john',
        }),
      }));

      expect(state.byID[40].displayName).toEqual('john');
    });

    it('uses display_name if present and non-zero-length', () => {
      const state = reducer(initialState, loadUserAccount({
        user: createUserAccountResponse({
          // The `createUserAccountResponse` helper converts displayName to
          // display_name, which is the actual property the API returns.
          displayName: 'coolperson',
          id: 40,
          username: 'john',
        }),
      }));

      expect(state.byID[40].displayName).toEqual('coolperson');
    });

    it('loadUserAccount returns a user', () => {
      const user = createUserAccountResponse();
      const action = loadUserAccount({ user });

      expect(action.type).toEqual(LOAD_USER_ACCOUNT);
      expect(action.payload).toEqual({ user });
    });

    it('throws when no username is passed to loadUserAccount', () => {
      expect(() => {
        loadUserAccount({});
      }).toThrowError('user is required');
    });
  });
});
