import * as React from 'react';

import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  RECOMMENDED,
} from 'amo/constants';
import StaticAddonCard from 'blog-utils/StaticAddonCard';
import {
  fakeAddon,
  createLocalizedString,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  render as defaultRender,
  screen,
  userAgents,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: userAgents.chrome[0],
    }).store;
  });

  const render = ({ addon }) => {
    return defaultRender(<StaticAddonCard addon={addon} />, { store });
  };

  it('renders nothing when add-on is falsey', () => {
    const { root } = render({ addon: null });

    expect(root).toBeNull();
  });

  it('renders a static add-on card', () => {
    const name = 'My Add-On';
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      name: createLocalizedString(name),
      promoted: { category: RECOMMENDED, apps: [CLIENT_APP_FIREFOX] },
    });

    render({ addon });

    expect(screen.getByClassName('StaticAddonCard')).toHaveAttribute(
      'data-addon-id',
      String(addon.id),
    );

    expect(screen.getByRole('heading')).toHaveTextContent(name);
    expect(screen.getByRole('link', { name })).toHaveAttribute(
      'href',
      `/en-US/${clientApp}/addon/${addon.slug}/`,
    );
    expect(
      screen.getByRole('link', { name: addon.authors[0].name }),
    ).toHaveAttribute(
      'href',
      `/en-US/${clientApp}/user/${addon.authors[0].id}/`,
    );

    // Promoted badge
    expect(
      screen.getByRole('link', {
        name: 'Firefox only recommends add-ons that meet our standards for security and performance.',
      }),
    ).toHaveTextContent('Recommended');

    expect(screen.getByText(addon.summary)).toBeInTheDocument();

    // GetFirefoxButton
    expect(
      screen.getByRole('link', {
        name: 'Download Firefox and get the extension',
      }),
    ).toBeInTheDocument();

    // This is always rendered but hidden by default using CSS.
    expect(
      screen.getByText('This extension is not currently available.'),
    ).toBeInTheDocument();
  });

  it('renders html as plaintext', () => {
    const plainText = '<script>alert(document.cookie);</script>';
    const scriptHTML = createLocalizedString(plainText);

    render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        summary: scriptHTML,
      }),
    });

    expect(screen.getByText(plainText)).toBeInTheDocument();
    // Make sure an actual script tag was not created.
    expect(screen.queryByTagName('script')).not.toBeInTheDocument();
  });

  it('renders a theme image preview when add-on is a theme', () => {
    const name = 'My Add-On';
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      name: createLocalizedString(name),
      type: ADDON_TYPE_STATIC_THEME,
    });

    render({ addon });

    expect(screen.getByClassName('StaticAddonCard')).toHaveClass(
      'StaticAddonCard--is-theme',
    );
    expect(screen.getByAltText(`Preview of ${name}`)).toHaveAttribute(
      'src',
      addon.previews[0].src,
    );
    expect(
      screen.queryByClassName('StaticAddonCard-icon'),
    ).not.toBeInTheDocument();
  });

  it('overrides some query parameters in the download FF link', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const expectedHref = [
      'https://www.mozilla.org/firefox/download/thanks/?s=direct',
      `utm_campaign=amo-blog-fx-cta-${addon.id}`,
      'utm_content=rta%3AMTIzNEBteS1hZGRvbnMuZmlyZWZveA',
      'utm_medium=referral',
      'utm_source=addons.mozilla.org',
    ].join('&');
    render({ addon });

    expect(
      screen.getByRole('link', {
        name: 'Download Firefox and get the extension',
      }),
    ).toHaveAttribute('href', expectedHref);
  });

  describe('AddonBadges', () => {
    it('renders the AddonBadges component with addon badges', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        average_daily_users: 12345,
        promoted: { category: RECOMMENDED, apps: [CLIENT_APP_FIREFOX] },
      });

      render({ addon });

      // Verify that badges are rendered
      expect(screen.getByTestId('badge-recommended')).toBeInTheDocument();
      expect(screen.getByTestId('badge-star-full')).toBeInTheDocument();
      expect(screen.getByTestId('badge-user-fill')).toBeInTheDocument();

      // Verify badge content
      expect(screen.getByTestId('badge-recommended')).toHaveTextContent(
        'Recommended',
      );
      expect(screen.getByTestId('badge-user-fill')).toHaveTextContent(
        '12,345 Users',
      );
    });

    it('renders user count badge with proper formatting', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        average_daily_users: 1000000,
      });

      render({ addon });

      const userBadge = screen.getByTestId('badge-user-fill');
      expect(userBadge).toBeInTheDocument();
      expect(userBadge).toHaveTextContent('1,000,000 Users');
    });

    it('renders zero users badge correctly', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        average_daily_users: 0,
      });

      render({ addon });

      const userBadge = screen.getByTestId('badge-user-fill');
      expect(userBadge).toBeInTheDocument();
      expect(userBadge).toHaveTextContent('No Users');
    });
  });
});
