import * as React from 'react';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import ServerError, {
  ServerErrorBase,
} from 'amo/components/Errors/ServerError';
import { createApiError } from 'amo/api';
import { loadErrorPage } from 'amo/reducers/errorPage';
import {
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

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

    expect(root.find(ErrorComponent)).toHaveProp('code', 500);
    expect(root.find(ErrorComponent)).toHaveProp('header', 'Server Error');

    expect(root.find('p').at(0)).toIncludeText(
      'but there was an error with our server and',
    );
  });
});
