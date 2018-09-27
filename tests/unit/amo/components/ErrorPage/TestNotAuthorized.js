import * as React from 'react';

import NotAuthorized, {
  NotAuthorizedBase,
} from 'amo/components/ErrorPage/NotAuthorized';
import { createApiError } from 'core/api';
import { loadErrorPage } from 'core/reducers/errorPage';
import Card from 'ui/components/Card';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...props }) => {
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

    expect(root.find(Card)).toHaveProp('header', 'Not Authorized');
  });
});
