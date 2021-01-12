import * as React from 'react';
import { oneLine } from 'common-tags';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import NotFound, { NotFoundBase } from 'amo/components/Errors/NotFound';
import Link from 'amo/components/Link';
import { createApiError } from 'amo/api';
import { loadErrorPage } from 'amo/reducers/errorPage';
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

    expect(root.find(ErrorComponent)).toHaveProp('code', 404);
    expect(root.find(ErrorComponent)).toHaveProp(
      'header',
      'Oops! We can’t find that page',
    );

    // The last paragraph has two internal links...
    const landingLinks = root.find('.Errors-paragraph-with-links').find(Link);
    expect(landingLinks).toHaveLength(3);
    expect(landingLinks.at(0)).toHaveProp('to', '/extensions/');
    expect(landingLinks.at(1)).toHaveProp('to', '/themes/');
    // ...and an external link.
    expect(landingLinks.at(2)).toHaveProp(
      'href',
      expect.stringContaining('discourse'),
    );
  });

  it('handles a localized string with links inverted', () => {
    const localizedString = oneLine`Some content with links inverted:
      %(themeStart)sthemes%(themeEnd)s or
      %(communityStart)scommunity forums%(communityEnd)s or
      %(extensionStart)sextensions%(extensionEnd)s.`;

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
    const landingLinks = root.find('.Errors-paragraph-with-links').find(Link);
    expect(landingLinks).toHaveLength(3);
    expect(landingLinks.at(0)).toHaveProp('to', '/themes/');
    expect(landingLinks.at(1)).toHaveProp('href');
    expect(landingLinks.at(2)).toHaveProp('to', '/extensions/');
  });
});
