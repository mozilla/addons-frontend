import { logOutUser } from 'core/actions';
import reducer, { userProfileLoaded } from 'core/reducers/user';
import { createUserProfileResponse } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { id, username } = reducer(undefined);
      expect(id).toEqual(null);
      expect(username).toEqual(null);
    });

    it('ignores unrelated actions', () => {
      const state = reducer(undefined, userProfileLoaded({
        profile: createUserProfileResponse({ id: 12345, username: 'john' }),
      }));
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('handles USER_PROFILE_LOADED', () => {
      const { id, username } = reducer(undefined, userProfileLoaded({
        profile: createUserProfileResponse({ id: 1234, username: 'user-test' }),
      }));
      expect(id).toEqual(1234);
      expect(username).toEqual('user-test');
    });

    it('throws an error when no profile is passed to USER_PROFILE_LOADED', () => {
      expect(() => {
        reducer(undefined, userProfileLoaded({}));
      }).toThrowError('The profile parameter is required.');
    });

    it('handles LOG_OUT_USER', () => {
      const state = reducer(undefined, userProfileLoaded({
        profile: createUserProfileResponse({ id: 12345, username: 'john' }),
      }));
      const { id, username } = reducer(state, logOutUser());
      expect(id).toEqual(null);
      expect(username).toEqual(null);
    });
  });
});
