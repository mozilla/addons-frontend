import reducer, {
  LOAD_USER_ACCOUNT,
  updateUserAccount,
  finishUpdateUserAccount,
  getCurrentUser,
  getUserById,
  getUserByUsername,
  hasAnyReviewerRelatedPermission,
  hasPermission,
  initialState,
  isDeveloper,
  loadCurrentUserAccount,
  loadUserAccount,
  loadUserNotifications,
  logOutUser,
  unloadUserAccount,
} from 'amo/reducers/users';
import {
  ADDONS_POSTREVIEW,
  ADDONS_CONTENTREVIEW,
  ADDONS_REVIEW,
  ALL_SUPER_POWERS,
  ADMIN_TOOLS_VIEW,
  STATS_VIEW,
  THEMES_REVIEW,
} from 'core/constants';
import {
  createUserAccountResponse,
  createUserNotificationsResponse,
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const { byID, byUsername } = reducer(undefined, { type: 'NONE' });
      expect(byID).toEqual({});
      expect(byUsername).toEqual({});
    });

    it('ignores unrelated actions', () => {
      const state = reducer(
        undefined,
        loadUserAccount({
          user: createUserAccountResponse({ id: 12345, username: 'john' }),
        }),
      );
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('handles LOG_OUT_USER', () => {
      const state = reducer(
        initialState,
        loadCurrentUserAccount({
          user: createUserAccountResponse({ id: 12345, username: 'john' }),
        }),
      );
      const { currentUserID } = reducer(state, logOutUser());

      expect(currentUserID).toEqual(null);
    });

    it('stores a loaded user ID by username in lowercase', () => {
      const state = reducer(
        initialState,
        loadUserAccount({
          user: createUserAccountResponse({ id: 12345, username: 'JohN' }),
        }),
      );

      expect(state.byUsername).toHaveProperty('john', 12345);
    });

    it('stores the current user ID by username in lowercase', () => {
      const state = reducer(
        initialState,
        loadCurrentUserAccount({
          user: createUserAccountResponse({ id: 12345, username: 'JohN' }),
        }),
      );

      expect(state.byUsername).toHaveProperty('john', 12345);
    });
  });

  describe('finishUpdateUserAccount', () => {
    it('sets a user account to not editing', () => {
      const user = createUserAccountResponse();
      const userFields = { biography: 'Punk rock music fan' };

      let state = reducer(
        initialState,
        updateUserAccount({
          errorHandlerId: 'fake-error-id',
          notifications: {},
          picture: null,
          userFields,
          userId: user.id,
        }),
      );
      state = reducer(state, finishUpdateUserAccount());

      expect(state.isUpdating).toEqual(false);
    });
  });

  describe('updateUserAccount', () => {
    it('sets user account to editing', () => {
      const user = createUserAccountResponse();
      const userFields = { biography: 'Punk rock music fan' };
      const state = reducer(
        initialState,
        updateUserAccount({
          errorHandlerId: 'fake-error-id',
          notifications: {},
          picture: null,
          userFields,
          userId: user.id,
        }),
      );

      expect(state.isUpdating).toEqual(true);
    });
  });

  describe('loadUserAccount', () => {
    it('sets notifications to `null` when loading a new user', () => {
      const user = createUserAccountResponse({ id: 12345, username: 'john' });
      const action = loadUserAccount({ user });

      const state = reducer(initialState, action);

      expect(action.type).toEqual(LOAD_USER_ACCOUNT);
      expect(action.payload).toEqual({ user });
      expect(state.isUpdating).toEqual(false);
      expect(state.byID[user.id]).toEqual({
        ...user,
        notifications: null,
      });
    });

    it('does not change the notifications when loading a user who was already in the state', () => {
      const user = createUserAccountResponse({ id: 12345, username: 'john' });
      const notifications = createUserNotificationsResponse();

      const prevState = reducer(
        // 1. load the user
        reducer(initialState, loadUserAccount({ user })),
        // 2. load their notifications
        loadUserNotifications({ notifications, userId: user.id }),
      );

      expect(prevState.byID[user.id]).toEqual({
        ...user,
        notifications,
      });

      const updatedUser = {
        ...user,
        biography: 'some new biography',
      };

      const state = reducer(prevState, loadUserAccount({ user: updatedUser }));

      expect(state.byID[user.id]).toEqual({
        ...updatedUser,
        notifications,
      });
    });
  });

  describe('loadCurrentUserAccount', () => {
    it('sets notifications to `null` when loading the current user', () => {
      const userId = 12345;
      const user = createUserAccountResponse({ id: userId, username: 'john' });

      const state = reducer(initialState, loadCurrentUserAccount({ user }));

      expect(state.byID[userId]).toEqual({
        ...user,
        notifications: null,
      });
      expect(state.currentUserID).toEqual(userId);
    });
  });

  describe('loadUserNotifications', () => {
    it('loads notifications for a user', () => {
      const userId = 12345;
      const user = createUserAccountResponse({ id: userId, username: 'john' });
      const notifications = createUserNotificationsResponse();

      const prevState = reducer(initialState, loadCurrentUserAccount({ user }));

      expect(prevState.byID[userId]).toEqual({
        ...user,
        notifications: null,
      });

      const state = reducer(
        prevState,
        loadUserNotifications({
          notifications,
          userId: user.id,
        }),
      );

      expect(state.byID[userId]).toEqual({
        ...user,
        notifications,
      });
    });
  });

  describe('unloadUserAccount', () => {
    it('unloads a user from the state given a user ID', () => {
      const userId = 12345;
      const username = 'john';

      const user = createUserAccountResponse({ id: userId, username });
      const prevState = reducer(initialState, loadUserAccount({ user }));

      expect(prevState.byID[userId]).toEqual({
        ...user,
        notifications: null,
      });
      expect(prevState.byUsername[username]).toEqual(userId);

      const state = reducer(prevState, unloadUserAccount({ userId }));

      expect(state.byID[userId]).toBeUndefined();
      expect(state.byUsername[username]).toBeUndefined();
    });

    it('does not do anything if user ID is not found', () => {
      const userId = 12345;

      const state = reducer(initialState, unloadUserAccount({ userId }));
      expect(state.byID[userId]).toBeUndefined();
    });

    it('sets the current user ID to `null` if it is the user to unload', () => {
      const userId = 12345;
      const username = 'john';

      const user = createUserAccountResponse({ id: userId, username });
      const prevState = reducer(initialState, loadCurrentUserAccount({ user }));

      const state = reducer(prevState, unloadUserAccount({ userId }));

      expect(state.byID[userId]).toBeUndefined();
      expect(state.byUsername[username]).toBeUndefined();
      expect(state.currentUserID).toEqual(null);
    });
  });

  describe('getCurrentUser selector', () => {
    it('returns a user when user is authenticated', () => {
      const { state } = dispatchSignInActions();

      expect(getCurrentUser(state.users)).toEqual(
        state.users.byID[state.users.currentUserID],
      );
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
      const permissions = [STATS_VIEW];
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

      expect(getUserByUsername(state.users, 'Tupac')).toEqual(
        state.users.byID[500],
      );
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

      expect(getUserByUsername(state.users, 'tupac')).toEqual(
        state.users.byID[500],
      );
    });
  });

  describe('isDeveloper', () => {
    it('returns false when user is null', () => {
      expect(isDeveloper(null)).toEqual(false);
    });

    it('returns true when user is an artist', () => {
      const user = createUserAccountResponse({
        is_artist: true,
      });

      expect(isDeveloper(user)).toEqual(true);
    });

    it('returns true when user is an add-on developer', () => {
      const user = createUserAccountResponse({
        is_addon_developer: true,
      });

      expect(isDeveloper(user)).toEqual(true);
    });

    it('returns false when user is not a developer', () => {
      const user = createUserAccountResponse();

      expect(isDeveloper(user)).toEqual(false);
    });
  });
});
