import reducer, {
  LOAD_USER_ACCOUNT,
  finishEditUserAccount,
  editUserAccount,
  getCurrentUser,
  getUserById,
  getUserByUsername,
  hasAnyReviewerRelatedPermission,
  hasPermission,
  initialState,
  loadCurrentUserAccount,
  loadUserAccount,
  logOutUser,
} from 'amo/reducers/users';
import {
  ADDONS_POSTREVIEW,
  ADDONS_CONTENTREVIEW,
  ADDONS_REVIEW,
  ALL_SUPER_POWERS,
  ADMIN_TOOLS_VIEW,
  COLLECTIONS_EDIT,
  STATS_VIEW,
  THEMES_REVIEW,
} from 'core/constants';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import { createUserAccountResponse } from 'tests/unit/helpers';


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

    it('loadUserAccount returns a user', () => {
      const user = createUserAccountResponse({ id: 12345, username: 'john' });
      const action = loadUserAccount({ user });
      const state = reducer(initialState, action);

      expect(action.type).toEqual(LOAD_USER_ACCOUNT);
      expect(action.payload).toEqual({ user });
      expect(state.isUpdating).toEqual(false);
    });

    it('handles LOG_OUT_USER', () => {
      const state = reducer(initialState, loadCurrentUserAccount({
        user: createUserAccountResponse({ id: 12345, username: 'john' }),
      }));
      const { currentUserID } = reducer(state, logOutUser());

      expect(currentUserID).toEqual(null);
    });

    it('indexes a loaded user ID by username', () => {
      const state = reducer(initialState, loadUserAccount({
        user: createUserAccountResponse({ id: 12345, username: 'JohN' }),
      }));

      expect(state.byUsername).toHaveProperty('john', 12345);
    });

    it('indexes the current user ID by username', () => {
      const state = reducer(initialState, loadCurrentUserAccount({
        user: createUserAccountResponse({ id: 12345, username: 'JohN' }),
      }));

      expect(state.byUsername).toHaveProperty('john', 12345);
    });
  });

  describe('finishEditUserAccount', () => {
    it('sets a user account to not editing', () => {
      const user = createUserAccountResponse();
      const userFields = { biography: 'Punk rock music fan' };

      let state = reducer(initialState, editUserAccount({
        errorHandlerId: 'fake-error-id',
        userFields,
        userId: user.id,
      }));
      state = reducer(state, finishEditUserAccount());

      expect(state.isUpdating).toEqual(false);
    });
  });

  describe('editUserAccount', () => {
    it('sets user account to editing', () => {
      const user = createUserAccountResponse();
      const userFields = { biography: 'Punk rock music fan' };

      const state = reducer(initialState, editUserAccount({
        errorHandlerId: 'fake-error-id',
        userFields,
        userId: user.id,
      }));

      expect(state.isUpdating).toEqual(true);
    });
  });

  describe('getCurrentUser selector', () => {
    it('returns a user when user is authenticated', () => {
      const { state } = dispatchSignInActions();

      expect(getCurrentUser(state.users))
        .toEqual(state.users.byID[state.users.currentUserID]);
    });

    it('returns null when user is not authenticated', () => {
      const { state } = dispatchClientMetadata();

      expect(getCurrentUser(state.users)).toEqual(null);
    });
  });

  describe('hasPermission selector', () => {
    it('returns `true` when user has the given permission', () => {
      const permissions = [ADMIN_TOOLS_VIEW, STATS_VIEW];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasPermission(state, STATS_VIEW)).toEqual(true);
    });

    it('returns `false` when user does not have the given permission', () => {
      const permissions = [ADMIN_TOOLS_VIEW, STATS_VIEW];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasPermission(state, THEMES_REVIEW)).toEqual(false);
    });

    it('returns `false` when user state has no permissions', () => {
      const { state } = dispatchSignInActions({
        userProps: { permissions: null },
      });

      expect(hasPermission(state, THEMES_REVIEW)).toEqual(false);
    });

    it('returns `false` when user is not logged in', () => {
      const { state } = dispatchClientMetadata();

      expect(hasPermission(state, THEMES_REVIEW)).toEqual(false);
    });

    it('returns `true` when user is admin', () => {
      const permissions = [ALL_SUPER_POWERS];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasPermission(state, THEMES_REVIEW)).toEqual(true);
    });
  });

  describe('hasAnyReviewerRelatedPermission selector', () => {
    it('returns `true` when user has ADDONS_POSTREVIEW', () => {
      const permissions = [ADDONS_POSTREVIEW, STATS_VIEW];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });

    it('returns `true` when user has ADDONS_CONTENTREVIEW', () => {
      const permissions = [STATS_VIEW, ADDONS_CONTENTREVIEW];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });

    it('returns `true` when user has ADDONS_REVIEW', () => {
      const permissions = [ADDONS_REVIEW];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });

    it('returns `false` when user does not have any reviewer permissions', () => {
      const permissions = [COLLECTIONS_EDIT, STATS_VIEW];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasAnyReviewerRelatedPermission(state)).toEqual(false);
    });

    it('returns `false` when user state has no permissions', () => {
      const { state } = dispatchSignInActions({
        userProps: { permissions: null },
      });

      expect(hasAnyReviewerRelatedPermission(state)).toEqual(false);
    });

    it('returns `false` when user is not logged in', () => {
      const { state } = dispatchClientMetadata();

      expect(hasAnyReviewerRelatedPermission(state)).toEqual(false);
    });

    it('returns `true` when user is admin', () => {
      const permissions = [ALL_SUPER_POWERS];
      const { state } = dispatchSignInActions({ userProps: { permissions } });

      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });
  });

  describe('getUserById selector', () => {
    it('returns a user from state', () => {
      const { state } = dispatchSignInActions({
        userProps: { id: 500, username: 'Tupac' },
      });

      expect(getUserById(state.users, 500)).toEqual(state.users.byID[500]);
    });

    it('returns undefined if no user is found', () => {
      const { state } = dispatchSignInActions({
        userProps: { id: 500, username: 'Tupac' },
      });

      expect(getUserById(state.users, 441)).toBeUndefined();
    });
  });

  describe('getUserByUsername selector', () => {
    it('returns a user from state', () => {
      const { state } = dispatchSignInActions({
        userProps: { id: 500, username: 'Tupac' },
      });

      expect(getUserByUsername(state.users, 'Tupac'))
        .toEqual(state.users.byID[500]);
    });

    it('returns undefined if no user is found', () => {
      const { state } = dispatchSignInActions({
        userProps: { id: 500, username: 'Tupac' },
      });

      expect(getUserByUsername(state.users, 'Biggie')).toBeUndefined();
    });

    it('is case insensitive', () => {
      const { state } = dispatchSignInActions({
        userProps: { id: 500, username: 'Tupac' },
      });

      expect(getUserByUsername(state.users, 'tupac'))
        .toEqual(state.users.byID[500]);
    });
  });
});
