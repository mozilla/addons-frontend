import { logOutUser } from 'core/actions';
import reducer, {
  isAuthenticated,
  loadUserProfile,
} from 'core/reducers/user';
import { createUserProfileResponse } from 'tests/unit/helpers';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { id, username } = reducer(undefined);
      expect(id).toEqual(null);
      expect(username).toEqual(null);
    });

    it('ignores unrelated actions', () => {
      const state = reducer(undefined, loadUserProfile({
        profile: createUserProfileResponse({ id: 12345, username: 'john' }),
      }));
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('handles LOAD_USER_PROFILE', () => {
      const { id, username } = reducer(undefined, loadUserProfile({
        profile: createUserProfileResponse({ id: 1234, username: 'user-test' }),
      }));
      expect(id).toEqual(1234);
      expect(username).toEqual('user-test');
    });

    it('throws an error when no profile is passed to LOAD_USER_PROFILE', () => {
      expect(() => {
        reducer(undefined, loadUserProfile({}));
      }).toThrowError('The profile parameter is required.');
    });

    it('handles LOG_OUT_USER', () => {
      const state = reducer(undefined, loadUserProfile({
        profile: createUserProfileResponse({ id: 12345, username: 'john' }),
      }));
      const { id, username } = reducer(state, logOutUser());
      expect(id).toEqual(null);
      expect(username).toEqual(null);
    });
  });

  describe('isAuthenticated selector', () => {
    it('returns true when user is authenticated', () => {
      const { state } = dispatchSignInActions();

      expect(isAuthenticated(state)).toEqual(true);
    });

    it('returns false when user is not authenticated', () => {
      const { state } = dispatchClientMetadata();

      expect(isAuthenticated(state)).toEqual(false);
    });
  });
});
