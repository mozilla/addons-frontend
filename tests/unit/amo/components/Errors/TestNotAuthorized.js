import * as React from 'react';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import NotAuthorized, {
  NotAuthorizedBase,
} from 'amo/components/Errors/NotAuthorized';
import { createApiError } from 'amo/api';
import { loadErrorPage } from 'amo/reducers/errorPage';
import {
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...props } = {}) => {
    const { store } = dispatchSignInActions();

    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 401 },
    });
    store.dispatch(loadErrorPage({ error }));

    return shallowUntilTarget(
      <NotAuthorized i18n={fakeI18n()} {...props} />,
      NotAuthorizedBase,
    );
  };

  it('renders a not authorized error', () => {
    const root = render();

    expect(root.find(ErrorComponent)).toHaveProp('code', 401);
    expect(root.find(ErrorComponent)).toHaveProp('header', 'Not Authorized');
  });
});
