/* @flow */
import config from 'config';
import Cookies from 'universal-cookie';

import { storeCookie } from 'amo/reducers/cookies';
import type { StoredCookie } from 'amo/reducers/cookies';
import type { DispatchFunc } from 'amo/types/redux';

export const setCookie = ({
  _config = config,
  _cookies = null,
  cookie,
  dispatch,
}: {|
  cookie: StoredCookie,
  dispatch: DispatchFunc,
|}) => {
  if (_config.get('server')) {
    dispatch(storeCookie({ cookie }));
  } else {
    const cookies = _cookies || new Cookies();
    cookies.set(cookie.name, cookie.value, cookie.config);
  }
};
