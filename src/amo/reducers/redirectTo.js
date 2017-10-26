/* @flow */

const SEND_SERVER_REDIRECT: 'SEND_SERVER_REDIRECT' = 'SEND_SERVER_REDIRECT';

type State = {|
  url: null | string,
  status: null | 301 | 302 | 303 | 305 | 307 | 308,
|};

export const initialState = {
  url: null,
  status: null,
};

type SendServerRedirectParams = {|
  ...State,
|};

type SendServerRedirectAction ={|
  type: typeof SEND_SERVER_REDIRECT,
  payload: SendServerRedirectParams,
|};

export const sendServerRedirect = (
  { status, url }: SendServerRedirectParams
): SendServerRedirectAction => {
  if (!status) {
    throw new Error('status is required');
  }
  if (!url) {
    throw new Error('url is required');
  }

  return {
    type: SEND_SERVER_REDIRECT,
    payload: {
      status,
      url,
    },
  };
};

type Action = SendServerRedirectAction;

const reducer = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case SEND_SERVER_REDIRECT: {
      const payload = action.payload;

      return {
        status: payload.status,
        url: payload.url,
      };
    }
    default:
      return state;
  }
};

export default reducer;
