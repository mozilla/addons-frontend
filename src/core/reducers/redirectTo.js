/* @flow */
import config from 'config';

import log from 'core/logger';


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
  _config?: Object,
|};

type SendServerRedirectAction ={|
  type: typeof SEND_SERVER_REDIRECT,
  payload: {|
    ...State,
  |},
|};

export const sendServerRedirect = (
  { status, url, _config = config }: SendServerRedirectParams
): SendServerRedirectAction => {
  if (!status) {
    throw new Error('status is required');
  }
  if (!url) {
    throw new Error('url is required');
  }
  if (!_config.get('server')) {
    log.warn(`sendServerRedirect() currently does nothing when run from client
      code`);
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
      const { payload } = action;

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
