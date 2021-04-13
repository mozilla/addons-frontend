/* @flow */
export const STORE_COOKIE: 'STORE_COOKIE' = 'STORE_COOKIE';

// https://github.com/reactivestack/cookies/tree/f9beead40a6bebac475d9bf17c1da55418d26751/packages/react-cookie#setcookiename-value-options
export type CookieConfig = {|
  maxAge?: number,
  path?: string,
  secure?: boolean,
|};

export type StoredCookie = {|
  name: string,
  value: string,
  config: CookieConfig,
|};

export type CookiesState = {|
  cookies: Array<StoredCookie>,
|};

export const initialState: CookiesState = {
  cookies: [],
};

type StoreCookieParams = {|
  cookie: StoredCookie,
|};

export type StoreCookieAction = {|
  type: typeof STORE_COOKIE,
  payload: StoreCookieParams,
|};

export const storeCookie = ({
  cookie,
}: StoreCookieParams): StoreCookieAction => {
  return {
    type: STORE_COOKIE,
    payload: { cookie },
  };
};

export const getStoredCookies = (
  cookiesState: CookiesState,
): Array<StoredCookie> => {
  return cookiesState.cookies;
};

type Action = StoreCookieAction;

export default function cookiesReducer(
  state: CookiesState = initialState,
  action: Action,
): CookiesState {
  switch (action.type) {
    case STORE_COOKIE: {
      const { cookie } = action.payload;

      return {
        ...state,
        cookies: [...state.cookies, cookie],
      };
    }
    default:
      return state;
  }
}
