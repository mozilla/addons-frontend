import { logOutUser } from 'core/actions';
import {
  ADMIN_SUPER_POWERS,
  ADMIN_TOOLS_VIEW,
  STATS_VIEW,
  THEMES_REVIEW,
} from 'core/constants';
import reducer, {
  isAuthenticated,
  loadUserProfile,
  selectDisplayName,
  hasPermission,
} from 'core/reducers/user';
import { createUserProfileResponse } from 'tests/unit/helpers';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { displayName, id, username, permissions } = reducer(undefined);
      expect(id).toEqual(null);
      expect(username).toEqual(null);
      expect(displayName).toEqual(null);
      expect(permissions).toEqual(null);
    });

    it('ignores unrelated actions', () => {
      const state = reducer(undefined, loadUserProfile({
        profile: createUserProfileResponse({ id: 12345, username: 'john' }),
      }));
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('handles LOAD_USER_PROFILE', () => {
      const { id, username, permissions } = reducer(undefined, loadUserProfile({
        profile: createUserProfileResponse({
          id: 1234,
          username: 'user-test',
          permissions: [ADMIN_TOOLS_VIEW],
        }),
      }));
      expect(id).toEqual(1234);
      expect(username).toEqual('user-test');
      expect(permissions).toEqual([ADMIN_TOOLS_VIEW]);
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
      const {
        displayName,
        id,
        username,
        permissions,
      } = reducer(state, logOutUser());

      expect(id).toEqual(null);
      expect(username).toEqual(null);
      expect(displayName).toEqual(null);
      expect(permissions).toEqual(null);
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

  describe('selectDisplayName selector', () => {
    it('returns the display name when user has a display name', () => {
      const displayName = 'King of the Elephants';
      const { state } = dispatchSignInActions({ displayName });

      expect(selectDisplayName(state)).toEqual(displayName);
    });

    it('returns the username when display name is null', () => {
      const username = 'babar';
      const displayName = null;
      const { state } = dispatchSignInActions({ username, displayName });

      expect(selectDisplayName(state)).toEqual(username);
    });

    it('returns the username when display name is undefined', () => {
      const username = 'babar';
      const displayName = undefined;
      const { state } = dispatchSignInActions({ username, displayName });

      expect(selectDisplayName(state)).toEqual(username);
    });

    it('returns the username when display name is an empty string', () => {
      const username = 'babar';
      const displayName = '';
      const { state } = dispatchSignInActions({ username, displayName });

      expect(selectDisplayName(state)).toEqual(username);
    });

    it('returns the username when user did not define a display name', () => {
      const username = 'babar';
      const { state } = dispatchSignInActions({ username });

      expect(selectDisplayName(state)).toEqual(username);
    });
  });

  describe('hasPermission selector', () => {
    it('returns `true` when user has the given permission', () => {
      const permissions = [ADMIN_TOOLS_VIEW, STATS_VIEW];
      const { state } = dispatchSignInActions({ permissions });

      expect(hasPermission(state, STATS_VIEW)).toEqual(true);
    });

    it('returns `false` when user does not have the given permission', () => {
      const permissions = [ADMIN_TOOLS_VIEW, STATS_VIEW];
      const { state } = dispatchSignInActions({ permissions });

      expect(hasPermission(state, THEMES_REVIEW)).toEqual(false);
    });

    it('returns `false` when user state has no permissions', () => {
      const { state } = dispatchSignInActions({ permissions: null });

      expect(hasPermission(state, THEMES_REVIEW)).toEqual(false);
    });

    it('returns `false` when user is not logged in', () => {
      const { state } = dispatchClientMetadata();

      expect(hasPermission(state, THEMES_REVIEW)).toEqual(false);
    });

    it('returns `true` when user is admin', () => {
      const permissions = [ADMIN_SUPER_POWERS];
      const { state } = dispatchSignInActions({ permissions });


      expect(hasPermission(state, THEMES_REVIEW)).toEqual(true);
    });
  });
});
