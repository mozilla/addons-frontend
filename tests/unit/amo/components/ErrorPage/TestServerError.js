import * as React from 'react';

import ServerError, {
  ServerErrorBase,
} from 'amo/components/ErrorPage/ServerError';
import { createApiError } from 'core/api';
import { loadErrorPage } from 'core/reducers/errorPage';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...props }) => {
    const { store } = dispatchSignInActions();

    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 500 },
    });
    store.dispatch(loadErrorPage({ error }));

    return shallowUntilTarget(
      <ServerError i18n={fakeI18n()} {...props} />,
      ServerErrorBase,
    );
  };

  it('renders a server error', () => {
    const root = render();

    expect(root.find('p').at(0)).toIncludeText(
      'but there was an error with our server and',
    );
  });
});
