import * as React from 'react';

import Button from 'amo/components/Button';
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
import { API_ERRORS_SESSION_EXPIRY } from 'amo/constants';

describe(__filename, () => {
  let store;

  const render = (code, customProps = {}) => {
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 401, code },
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

  it.each(API_ERRORS_SESSION_EXPIRY)(
    'renders a not authorized error',
    (code) => {
      const root = render(code);

      const component = root.find(ErrorComponent);
      expect(component).toHaveProp('code', 401);
      expect(component).toHaveProp('header', 'Login Expired');
    },
  );

  it.each(API_ERRORS_SESSION_EXPIRY)('logs out the user', (code) => {
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render(code);

    sinon.assert.calledWith(dispatchSpy, logOutUserAction());
  });

  it.each(API_ERRORS_SESSION_EXPIRY)('renders a reload button', (code) => {
    const _window = { location: { reload: sinon.stub() } };
    const root = render(code, { _window });

    const button = root.find(Button);
    expect(button.childAt(0).text()).toContain('Reload the page');
    expect(button.prop('onClick')).toBeDefined();

    const action = button.prop('onClick');
    // Simulate the callback on button press.
    action();

    // The button should reload the location.
    sinon.assert.called(_window.location.reload);
  });
});
