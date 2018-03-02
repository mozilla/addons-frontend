import * as React from 'react';

import NotFound, {
  NotFoundBase,
} from 'amo/components/ErrorPage/NotFound';
import SuggestedPages from 'amo/components/SuggestedPages';
import { createApiError } from 'core/api';
import {
  ERROR_ADDON_DISABLED_BY_ADMIN, ERROR_ADDON_DISABLED_BY_DEV,
} from 'core/constants';
import { loadErrorPage } from 'core/reducers/errorPage';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  function render(customProps = {}) {
    const { store } = dispatchSignInActions();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 404 },
    });
    store.dispatch(loadErrorPage({ error }));

    const props = {
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(<NotFound {...props} />, NotFoundBase);
  }

  it('renders a not found error', () => {
    const root = render();

    expect(root.find('.ErrorPage'))
      .toHaveProp('header', 'Page not found');
    expect(root.find(SuggestedPages)).toHaveLength(1);
    expect(root.find('.NotFound-fileAnIssueText').html())
      .toContain('file an issue');
  });

  it('renders a disabled by developer error', () => {
    const root = render({ errorCode: ERROR_ADDON_DISABLED_BY_DEV });

    expect(root.find('.NotFound-explanation').html())
      .toContain('This add-on has been removed by its author.');
  });

  it('renders a disabled by admin error', () => {
    const root = render({ errorCode: ERROR_ADDON_DISABLED_BY_ADMIN });

    expect(root.find('.NotFound-explanation').html())
      .toContain('This add-on has been disabled by an administrator.');
  });
});
