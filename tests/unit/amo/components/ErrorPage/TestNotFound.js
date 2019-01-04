import * as React from 'react';

import NotFound, { NotFoundBase } from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import { createApiError } from 'core/api';
import { loadErrorPage } from 'core/reducers/errorPage';
import {
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

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

    expect(root.find('.ErrorPage')).toHaveProp(
      'header',
      'Oops! We can’t find that page',
    );

    // There is a link to GitHub in the first paragraph.
    expect(
      root
        .find('.ErrorPage-paragraph-with-links')
        .at(0)
        .html(),
    ).toContain('/new/">filing an issue</a>');

    // The last paragraph has two internal links.
    const landingLinks = root
      .find('.ErrorPage-paragraph-with-links')
      .at(1)
      .find(Link);
    expect(landingLinks).toHaveLength(2);
    expect(landingLinks.at(0)).toHaveProp('to', '/extensions/');
    expect(landingLinks.at(1)).toHaveProp('to', '/themes/');
  });
});
