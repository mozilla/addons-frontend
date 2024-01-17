import { oneLine } from 'common-tags';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  dispatchClientMetadata,
  fakeI18n,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store;
  });

  const render = (jed = fakeI18n()) =>
    defaultRender({
      initialEntries: ['/en-US/firefox/404/'],
      jed,
      store,
    });

  it('renders a NotFound Page', () => {
    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();

    expect(
      screen.getByTextAcrossTags(
        `Try visiting the page later, as the theme or extension may become ` +
          `available again. Alternatively, you may be able to find what you’re ` +
          `looking for in one of the available extensions or themes, or by ` +
          `asking for help on our community forums.`,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'extensions' })).toHaveAttribute(
      'href',
      '/en-US/firefox/extensions/',
    );
    expect(screen.getByRole('link', { name: 'themes' })).toHaveAttribute(
      'href',
      '/en-US/firefox/themes/',
    );
    expect(
      screen.getByRole('link', { name: 'community forums' }),
    ).toHaveAttribute('href', expect.stringContaining('discourse'));
  });

  it('handles a localized string with links inverted', () => {
    const localizedString = oneLine`Some content with links inverted:
      %(themeStart)sthemes%(themeEnd)s or
      %(communityStart)scommunity forums%(communityEnd)s or
      %(extensionStart)sextensions%(extensionEnd)s.`;

    const jed = fakeI18n();
    // We override the `gettext` function to inject a localized string with the
    // two links inverted. This was the issue in
    // https://github.com/mozilla/addons-frontend/issues/7597.
    jed.gettext = (string) => {
      if (string.startsWith('Try visiting')) {
        return localizedString;
      }

      return string;
    };

    // It should not crash.
    render(jed);

    expect(screen.getByRole('link', { name: 'extensions' })).toHaveAttribute(
      'href',
      '/en-US/firefox/extensions/',
    );
    expect(screen.getByRole('link', { name: 'themes' })).toHaveAttribute(
      'href',
      '/en-US/firefox/themes/',
    );
    expect(
      screen.getByRole('link', { name: 'community forums' }),
    ).toHaveAttribute('href', expect.stringContaining('discourse'));
  });
});
