import * as React from 'react';

import Header from 'amo/components/Header';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  dispatchClientMetadata,
  render as defaultRender,
  screen,
  userAgents,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return defaultRender(<Header {...props} />, {
      store: dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
        userAgent: userAgents.chrome[0],
      }).store,
    });
  };

  // Header is almost exclusively called from Page, so the majority of the
  // tests for it have been moved into TestPage.js. It is also, however,
  // used in blog-utils, so we need to keep this one test which cannot be
  // exercised from the Page component.
  it('can update its UI for the blog', () => {
    render({ forBlog: true, isAddonInstallPage: false });

    expect(
      screen.getByRole('link', { name: 'Firefox Browser Add-ons' }),
    ).toHaveAttribute('href', '/');
    expect(
      screen.queryByRole('link', { name: 'Log in' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTitle('Submit and manage extensions and themes'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Extensions' })).toHaveAttribute(
      'href',
      '/extensions/',
    );
    expect(
      screen.queryByRole('link', { name: 'download Firefox' }),
    ).not.toBeInTheDocument();
  });
});
