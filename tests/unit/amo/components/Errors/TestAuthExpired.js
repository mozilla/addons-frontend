import * as React from 'react';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import AuthExpired, {
  AuthExpiredBase,
} from 'amo/components/Errors/AuthExpired';
import { createApiError } from 'amo/api';
import { loadErrorPage } from 'amo/reducers/errorPage';
import {
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { API_ERROR_SIGNATURE_EXPIRED } from 'amo/constants';

describe(__filename, () => {
  const render = ({ ...props } = {}) => {
    const { store } = dispatchSignInActions();

    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 401, code: API_ERROR_SIGNATURE_EXPIRED },
    });
    store.dispatch(loadErrorPage({ error }));

    return shallowUntilTarget(
      <AuthExpired i18n={fakeI18n()} {...props} />,
      AuthExpiredBase,
    );
  };

  it('renders a not authorized error', () => {
    const root = render();

    expect(root.find(ErrorComponent)).toHaveProp('code', 401);
    expect(root.find(ErrorComponent)).toHaveProp('header', 'Login Expired');
  });
});
