import * as React from 'react';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import AuthExpired, {
  AuthExpiredBase,
} from 'amo/components/Errors/AuthExpired';
import { createApiError } from 'amo/api';
import { loadErrorPage } from 'amo/reducers/errorPage';
import { logOutUser as logOutUserAction } from 'amo/reducers/users';
import {
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { API_ERROR_SIGNATURE_EXPIRED } from 'amo/constants';

describe(__filename, () => {
  let store;

  const render = () => {
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 401, code: API_ERROR_SIGNATURE_EXPIRED },
    });
    store.dispatch(loadErrorPage({ error }));

    return shallowUntilTarget(
      <AuthExpired i18n={fakeI18n()} store={store} />,
      AuthExpiredBase,
    );
  };

  beforeEach(() => {
    store = dispatchSignInActions().store;
  });

  it('renders a not authorized error', () => {
    const root = render();

    const component = root.find(ErrorComponent);
    expect(component).toHaveProp('code', 401);
    expect(component).toHaveProp('header', 'Login Expired');
  });

  it('logs out the user', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render();

    sinon.assert.calledWith(dispatchSpy, logOutUserAction());
  });
});
