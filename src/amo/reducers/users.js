/* @flow */
export const FETCH_USER_ACCOUNT: 'FETCH_USER_ACCOUNT' = 'FETCH_USER_ACCOUNT';
export const LOAD_USER_ACCOUNT: 'LOAD_USER_ACCOUNT' = 'LOAD_USER_ACCOUNT';

export type UserId = string;

export type UserType = any;

export type UsersState = {
  byID: { [userId: string]: UserType },
  byUsername: { [username: string]: UserId },
};

export const initialState: UsersState = {
  byID: {},
  byUsername: {},
};

type FetchUserAccountParams = {|
  errorHandlerId: string,
  username: string,
|};

type FetchUserAccountAction = {|
  type: typeof FETCH_USER_ACCOUNT,
  payload: FetchUserAccountParams,
|};

export const fetchUserAccount = ({
  errorHandlerId,
  username,
}: FetchUserAccountParams): FetchUserAccountAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!username) {
    throw new Error('username is required');
  }

  return {
    type: FETCH_USER_ACCOUNT,
    payload: {
      errorHandlerId,
      username,
    },
  };
};

type LoadUserAccountParams = {|
  user: Object,
|};

type LoadUserAccountAction = {|
  type: typeof LOAD_USER_ACCOUNT,
  payload: LoadUserAccountParams,
|};

export const loadUserAccount = ({
  user,
}: LoadUserAccountParams): LoadUserAccountAction => {
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: LOAD_USER_ACCOUNT,
    payload: { user },
  };
};

type Action =
  | FetchUserAccountAction
  | LoadUserAccountAction;

const reducer = (
  state: UsersState = initialState,
  action: Action
): UsersState => {
  switch (action.type) {
    case LOAD_USER_ACCOUNT: {
      const { user } = action.payload;
      user.displayName = user.display_name && user.display_name.length ?
        user.display_name : user.username;

      const byID = { ...state.byID, [user.id]: user };
      const byUsername = { ...state.byUsername, [user.username]: user.id };

      return {
        ...state,
        byID,
        byUsername,
      };
    }

    default:
      return state;
  }
};

export default reducer;
