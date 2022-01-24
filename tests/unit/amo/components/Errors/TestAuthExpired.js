import * as React from 'react';

import Link from 'amo/components/Link';
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

  const render = (customProps = {}) => {
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 401, code: API_ERROR_SIGNATURE_EXPIRED },
    });
    store.dispatch(loadErrorPage({ error }));
    const props = {
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(<AuthExpired {...props} />, AuthExpiredBase);
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

  it('renders a reload link', () => {
    const _window = { location: { reload: sinon.stub() } };
    const root = render({ _window });

    const link = root.find(Link);
    expect(link.childAt(0).text()).toContain('Reload the page');
    expect(link.prop('onClick')).toBeDefined();

    const action = link.prop('onClick');
    // Simulate the callback on button press.
    action();

    // The button should reload the location.
    sinon.assert.called(_window.location.reload);
  });
});
