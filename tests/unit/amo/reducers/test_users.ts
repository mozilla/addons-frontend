import { LOCATION_CHANGE } from 'redux-first-history';

import reducer, { LOAD_USER_ACCOUNT, abortUnsubscribeNotification, finishUnsubscribeNotification, finishUpdateUserAccount, getCurrentUser, getUnsubscribeKey, getUserById, getUserByUsername, hasAnyReviewerRelatedPermission, hasPermission, initialState, isDeveloper, isUnsubscribedFor, loadCurrentUserAccount, loadUserAccount, loadUserNotifications, logOutUser, unloadUserAccount, unsubscribeNotification, updateUserAccount } from 'amo/reducers/users';
import { ADDONS_CONTENT_REVIEW, ADDONS_RECOMMENDED_REVIEW, ADDONS_REVIEW, ALL_SUPER_POWERS, REVIEWER_TOOLS_VIEW, STATIC_THEMES_REVIEW, STATS_VIEW } from 'amo/constants';
import { createUserAccountResponse, createUserNotificationsResponse, dispatchClientMetadata, dispatchSignInActions, getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const {
        byID,
        byUsername,
      } = reducer(undefined, {
        type: 'NONE',
      });
      expect(byID).toEqual({});
      expect(byUsername).toEqual({});
    });
    it('ignores unrelated actions', () => {
      const state = reducer(undefined, loadUserAccount({
        user: createUserAccountResponse({
          id: 12345,
          username: 'john',
        }),
      }));
      const newState = reducer(state, {
        type: 'UNRELATED',
      });
      expect(newState).toEqual(state);
    });
    it('handles LOG_OUT_USER', () => {
      const state = reducer(initialState, loadCurrentUserAccount({
        user: createUserAccountResponse({
          id: 12345,
          username: 'john',
        }),
      }));
      const {
        currentUserID,
        currentUserWasLoggedOut,
      } = reducer(state, logOutUser());
      expect(currentUserID).toEqual(null);
      expect(currentUserWasLoggedOut).toEqual(true);
    });
    it('stores a loaded user ID by username in lowercase', () => {
      const state = reducer(initialState, loadUserAccount({
        user: createUserAccountResponse({
          id: 12345,
          username: 'JohN',
        }),
      }));
      expect(state.byUsername).toHaveProperty('john', 12345);
    });
    it('stores the current user ID by username in lowercase', () => {
      const state = reducer(initialState, loadCurrentUserAccount({
        user: createUserAccountResponse({
          id: 12345,
          username: 'JohN',
        }),
      }));
      expect(state.byUsername).toHaveProperty('john', 12345);
    });
    it('sets `resetStateOnNextChange` to `true` after a location change on the client', () => {
      const _config = getFakeConfig({
        server: false,
      });

      const state = reducer(undefined, {
        type: LOCATION_CHANGE,
      }, _config);
      expect(state.resetStateOnNextChange).toEqual(true);
    });
    it('does not set `resetStateOnNextChange` to `true` after a location change on the server', () => {
      const _config = getFakeConfig({
        server: true,
      });

      const state = reducer(undefined, {
        type: LOCATION_CHANGE,
      }, _config);
      expect(state.resetStateOnNextChange).toEqual(false);
    });
    it('resets `currentUserWasLoggedOut` after two location changes on the client', () => {
      const _config = getFakeConfig({
        server: false,
      });

      const {
        store,
      } = dispatchSignInActions();
      store.dispatch(logOutUser());
      let state = store.getState().users;
      expect(state.currentUserWasLoggedOut).toEqual(true);
      // Perform two client-side location changes.
      state = reducer(state, {
        type: LOCATION_CHANGE,
      }, _config);
      expect(state.currentUserWasLoggedOut).toEqual(true);
      state = reducer(state, {
        type: LOCATION_CHANGE,
      }, _config);
      expect(state.currentUserWasLoggedOut).toEqual(false);
    });
    it('does not reset `currentUserWasLoggedOut` after only one location change on the client', () => {
      const _config = getFakeConfig({
        server: false,
      });

      const {
        store,
      } = dispatchSignInActions();
      store.dispatch(logOutUser());
      const state = store.getState().users;
      expect(state.currentUserWasLoggedOut).toEqual(true);
      reducer(state, {
        type: LOCATION_CHANGE,
      }, _config);
      expect(state.currentUserWasLoggedOut).toEqual(true);
    });
  });
  describe('finishUpdateUserAccount', () => {
    it('sets a user account to not editing', () => {
      const user = createUserAccountResponse();
      const userFields = {
        biography: 'Punk rock music fan',
      };
      let state = reducer(initialState, updateUserAccount({
        errorHandlerId: 'fake-error-id',
        notifications: {},
        picture: null,
        userFields,
        userId: user.id,
      }));
      state = reducer(state, finishUpdateUserAccount());
      expect(state.isUpdating).toEqual(false);
    });
  });
  describe('updateUserAccount', () => {
    it('sets user account to editing', () => {
      const user = createUserAccountResponse();
      const userFields = {
        biography: 'Punk rock music fan',
      };
      const state = reducer(initialState, updateUserAccount({
        errorHandlerId: 'fake-error-id',
        notifications: {},
        picture: null,
        userFields,
        userId: user.id,
      }));
      expect(state.isUpdating).toEqual(true);
    });
  });
  describe('loadUserAccount', () => {
    it('sets notifications to `null` when loading a new user', () => {
      const user = createUserAccountResponse({
        id: 12345,
        username: 'john',
      });
      const action = loadUserAccount({
        user,
      });
      const state = reducer(initialState, action);
      expect(action.type).toEqual(LOAD_USER_ACCOUNT);
      expect(action.payload).toEqual({
        user,
      });
      expect(state.isUpdating).toEqual(false);
      expect(state.byID[user.id]).toEqual({ ...user,
        notifications: null,
      });
    });
    it('does not change the notifications when loading a user who was already in the state', () => {
      const user = createUserAccountResponse({
        id: 12345,
        username: 'john',
      });
      const notifications = createUserNotificationsResponse();
      const prevState = reducer( // 1. load the user
      reducer(initialState, loadUserAccount({
        user,
      })), // 2. load their notifications
      loadUserNotifications({
        notifications,
        userId: user.id,
      }));
      expect(prevState.byID[user.id]).toEqual({ ...user,
        notifications,
      });
      const updatedUser = { ...user,
        biography: 'some new biography',
      };
      const state = reducer(prevState, loadUserAccount({
        user: updatedUser,
      }));
      expect(state.byID[user.id]).toEqual({ ...updatedUser,
        notifications,
      });
    });
  });
  describe('loadCurrentUserAccount', () => {
    it('sets notifications to `null` when loading the current user', () => {
      const userId = 12345;
      const user = createUserAccountResponse({
        id: userId,
        username: 'john',
      });
      const state = reducer(initialState, loadCurrentUserAccount({
        user,
      }));
      expect(state.byID[userId]).toEqual({ ...user,
        notifications: null,
      });
      expect(state.currentUserID).toEqual(userId);
    });
  });
  describe('loadUserNotifications', () => {
    it('loads notifications for a user', () => {
      const userId = 12345;
      const user = createUserAccountResponse({
        id: userId,
        username: 'john',
      });
      const notifications = createUserNotificationsResponse();
      const prevState = reducer(initialState, loadCurrentUserAccount({
        user,
      }));
      expect(prevState.byID[userId]).toEqual({ ...user,
        notifications: null,
      });
      const state = reducer(prevState, loadUserNotifications({
        notifications,
        userId: user.id,
      }));
      expect(state.byID[userId]).toEqual({ ...user,
        notifications,
      });
    });
  });
  describe('unloadUserAccount', () => {
    it('unloads a user from the state given a user ID', () => {
      const userId = 12345;
      const username = 'john';
      const user = createUserAccountResponse({
        id: userId,
        username,
      });
      const prevState = reducer(initialState, loadUserAccount({
        user,
      }));
      expect(prevState.byID[userId]).toEqual({ ...user,
        notifications: null,
      });
      expect(prevState.byUsername[username]).toEqual(userId);
      const state = reducer(prevState, unloadUserAccount({
        userId,
      }));
      expect(state.byID[userId]).toBeUndefined();
      expect(state.byUsername[username]).toBeUndefined();
    });
    it('does not do anything if user ID is not found', () => {
      const userId = 12345;
      const state = reducer(initialState, unloadUserAccount({
        userId,
      }));
      expect(state.byID[userId]).toBeUndefined();
    });
    it('sets the current user ID to `null` if it is the user to unload', () => {
      const userId = 12345;
      const username = 'john';
      const user = createUserAccountResponse({
        id: userId,
        username,
      });
      const prevState = reducer(initialState, loadCurrentUserAccount({
        user,
      }));
      const state = reducer(prevState, unloadUserAccount({
        userId,
      }));
      expect(state.byID[userId]).toBeUndefined();
      expect(state.byUsername[username]).toBeUndefined();
      expect(state.currentUserID).toEqual(null);
    });
  });
  describe('getCurrentUser selector', () => {
    it('returns a user when user is authenticated', () => {
      const {
        state,
      } = dispatchSignInActions();
      expect(getCurrentUser(state.users)).toEqual(state.users.byID[state.users.currentUserID]);
    });
    it('returns null when user is not authenticated', () => {
      const {
        state,
      } = dispatchClientMetadata();
      expect(getCurrentUser(state.users)).toEqual(null);
    });
  });
  describe('hasPermission selector', () => {
    it('returns `true` when user has the given permission', () => {
      const permissions = [STATS_VIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasPermission(state, STATS_VIEW)).toEqual(true);
    });
    it('returns `false` when user does not have the given permission', () => {
      const permissions = [STATS_VIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasPermission(state, STATIC_THEMES_REVIEW)).toEqual(false);
    });
    it('returns `false` when user state has no permissions', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions: null,
        },
      });
      expect(hasPermission(state, STATIC_THEMES_REVIEW)).toEqual(false);
    });
    it('returns `false` when user is not logged in', () => {
      const {
        state,
      } = dispatchClientMetadata();
      expect(hasPermission(state, STATIC_THEMES_REVIEW)).toEqual(false);
    });
    it('returns `true` when user is admin', () => {
      const permissions = [ALL_SUPER_POWERS];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasPermission(state, STATIC_THEMES_REVIEW)).toEqual(true);
    });
    it('returns `true` when user has a broad permission', () => {
      const permissions = ['Addons:*'];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasPermission(state, 'Addons:Edit')).toEqual(true);
    });
    it('returns `false` when user does not have a broad permission', () => {
      const permissions = ['Addons:Review'];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasPermission(state, 'Addons:Edit')).toEqual(false);
    });
    it('returns `false` when user has a broad permission but app is different', () => {
      const permissions = ['Addons:*'];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasPermission(state, 'Users:Edit')).toEqual(false);
    });
  });
  describe('hasAnyReviewerRelatedPermission selector', () => {
    it('returns `true` when user has ADDONS_CONTENT_REVIEW', () => {
      const permissions = [STATS_VIEW, ADDONS_CONTENT_REVIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });
    it('returns `true` when user has ADDONS_REVIEW', () => {
      const permissions = [ADDONS_REVIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });
    it('returns `true` when user has STATIC_THEMES_REVIEW', () => {
      const permissions = [STATS_VIEW, STATIC_THEMES_REVIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });
    it('returns `true` when user has ADDONS_RECOMMENDED_REVIEW', () => {
      const permissions = [ADDONS_RECOMMENDED_REVIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });
    it('returns `true` when user has REVIEWER_TOOLS_VIEW', () => {
      const permissions = [REVIEWER_TOOLS_VIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });
    it('returns `false` when user does not have any reviewer permissions', () => {
      const permissions = [STATS_VIEW];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(false);
    });
    it('returns `false` when user state has no permissions', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions: null,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(false);
    });
    it('returns `false` when user is not logged in', () => {
      const {
        state,
      } = dispatchClientMetadata();
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(false);
    });
    it('returns `true` when user is admin', () => {
      const permissions = [ALL_SUPER_POWERS];
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          permissions,
        },
      });
      expect(hasAnyReviewerRelatedPermission(state)).toEqual(true);
    });
  });
  describe('getUserById selector', () => {
    it('returns a user from state', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          id: 500,
          username: 'Tupac',
        },
      });
      expect(getUserById(state.users, 500)).toEqual(state.users.byID[500]);
    });
    it('returns undefined if no user is found', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          id: 500,
          username: 'Tupac',
        },
      });
      expect(getUserById(state.users, 441)).toBeUndefined();
    });
    it('does not throw when userId is 0', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          id: 500,
          username: 'Tupac',
        },
      });
      expect(() => {
        getUserById(state.users, 0);
      }).not.toThrow();
    });
  });
  describe('getUserByUsername selector', () => {
    it('returns a user from state', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          id: 500,
          username: 'Tupac',
        },
      });
      expect(getUserByUsername(state.users, 'Tupac')).toEqual(state.users.byID[500]);
    });
    it('returns undefined if no user is found', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          id: 500,
          username: 'Tupac',
        },
      });
      expect(getUserByUsername(state.users, 'Biggie')).toBeUndefined();
    });
    it('is case insensitive', () => {
      const {
        state,
      } = dispatchSignInActions({
        userProps: {
          id: 500,
          username: 'Tupac',
        },
      });
      expect(getUserByUsername(state.users, 'tupac')).toEqual(state.users.byID[500]);
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
  describe('unsubscribeNotification', () => {
    it('sets `isUnsubscribedFor` to `false`', () => {
      const hash = 'some-hash';
      const notification = 'new_review';
      const token = 'some-token';
      const state = reducer(undefined, unsubscribeNotification({
        errorHandlerId: 'error-handler-id',
        hash,
        notification,
        token,
      }));
      expect(isUnsubscribedFor(state, hash, notification, token)).toEqual(false);
    });
    it('does not change the value of another notification', () => {
      const hash = 'some-hash';
      const token = 'some-token';
      const updatedNotification = 'updatedNotification';
      const pendingNotification = 'pendingNotification';
      let state = reducer(undefined, finishUnsubscribeNotification({
        hash,
        notification: updatedNotification,
        token,
      }));
      state = reducer(state, unsubscribeNotification({
        errorHandlerId: 'error-handler-id',
        hash,
        notification: pendingNotification,
        token,
      }));
      expect(isUnsubscribedFor(state, hash, updatedNotification, token)).toEqual(true);
      expect(isUnsubscribedFor(state, hash, pendingNotification, token)).toEqual(false);
    });
  });
  describe('finishUnsubscribeNotification', () => {
    it('sets `isUnsubscribedFor` to `true`', () => {
      const hash = 'some-hash';
      const notification = 'new_review';
      const token = 'some-token';
      const state = reducer(undefined, finishUnsubscribeNotification({
        hash,
        notification,
        token,
      }));
      expect(isUnsubscribedFor(state, hash, notification, token)).toEqual(true);
    });
    it('does not change the value of another notification', () => {
      const hash = 'some-hash';
      const token = 'some-token';
      const pendingNotification = 'pendingNotification';
      const updatedNotification = 'updatedNotification';
      let state = reducer(undefined, unsubscribeNotification({
        errorHandlerId: 'error-handler-id',
        hash,
        notification: pendingNotification,
        token,
      }));
      state = reducer(state, finishUnsubscribeNotification({
        hash,
        notification: updatedNotification,
        token,
      }));
      expect(isUnsubscribedFor(state, hash, pendingNotification, token)).toEqual(false);
      expect(isUnsubscribedFor(state, hash, updatedNotification, token)).toEqual(true);
    });
  });
  describe('abortUnsubscribeNotification', () => {
    it('sets `isUnsubscribedFor` to `null`', () => {
      const hash = 'some-hash';
      const notification = 'new_review';
      const token = 'some-token';
      const state = reducer(undefined, abortUnsubscribeNotification({
        hash,
        notification,
        token,
      }));
      expect(isUnsubscribedFor(state, hash, notification, token)).toEqual(null);
    });
    it('does not change the value of another notification', () => {
      const hash = 'some-hash';
      const token = 'some-token';
      const abortedNotification = 'abortedNotification';
      const pendingNotification = 'pendingNotification';
      let state = reducer(undefined, unsubscribeNotification({
        errorHandlerId: 'error-handler-id',
        hash,
        notification: pendingNotification,
        token,
      }));
      state = reducer(state, abortUnsubscribeNotification({
        hash,
        notification: abortedNotification,
        token,
      }));
      expect(isUnsubscribedFor(state, hash, pendingNotification, token)).toEqual(false);
      expect(isUnsubscribedFor(state, hash, abortedNotification, token)).toEqual(null);
    });
  });
  describe('getUnsubscribeKey', () => {
    it('creates a unique key based on a hash, a token and a notification name', () => {
      const hash = 'some-hash';
      const token = 'some-token';
      const notification = 'new_review';
      expect(getUnsubscribeKey({
        hash,
        notification,
        token,
      })).toEqual(`${hash}-${notification}-${token}`);
    });
  });
});