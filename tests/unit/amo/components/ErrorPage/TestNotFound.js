import * as React from 'react';
import { oneLine } from 'common-tags';

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

  it('handles a localized string with links inverted', () => {
    const localizedString = oneLine`Try visiting the page later, as the theme
      or extension may become available again. Alternatively, you may be able
      to find what you’re looking for in one of the available
      %(secondLinkStart)sthemes%(secondLinkEnd)s or
      %(linkStart)sextensions%(linkEnd)s.`;

    const i18n = fakeI18n();
    // We override the `gettext` function to inject a localized string with the
    // two links inverted. This was the issue in
    // https://github.com/mozilla/addons-frontend/issues/7597.
    i18n.gettext = (string) => {
      if (string.startsWith('Try visiting')) {
        return localizedString;
      }

      return string;
    };

    // It should not crash.
    const root = render({ i18n });
    const landingLinks = root
      .find('.ErrorPage-paragraph-with-links')
      .at(1)
      .find(Link);
    expect(landingLinks).toHaveLength(2);
    expect(landingLinks.at(0)).toHaveProp('to', '/themes/');
    expect(landingLinks.at(1)).toHaveProp('to', '/extensions/');
  });
});
