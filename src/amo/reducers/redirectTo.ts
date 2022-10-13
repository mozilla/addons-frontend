import config from 'config';

import log from 'amo/logger';

export const SEND_SERVER_REDIRECT: 'SEND_SERVER_REDIRECT' = 'SEND_SERVER_REDIRECT';
export type RedirectToState = {
  url: null | string;
  status: null | 301 | 302 | 303 | 305 | 307 | 308;
};
export const initialState = {
  url: null,
  status: null,
};
type SendServerRedirectParams = RedirectToState & {
  _config?: Record<string, any>;
};
type SendServerRedirectAction = {
  type: typeof SEND_SERVER_REDIRECT;
  payload: RedirectToState;
};
export const sendServerRedirect = ({
  status,
  url,
  _config = config,
}: SendServerRedirectParams): SendServerRedirectAction => {
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

const reducer = (state: RedirectToState = initialState, action: Action): RedirectToState => {
  switch (action.type) {
    case SEND_SERVER_REDIRECT:
      {
        const {
          payload,
        } = action;
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