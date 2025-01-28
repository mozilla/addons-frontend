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

  it('displays the number of users', () => {
    const average_daily_users = 1234567;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      average_daily_users,
    });
    render({ addon });

    expect(screen.getByText('Users: 1,234,567')).toBeInTheDocument();
  });

  it('shows 0 users', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      average_daily_users: 0,
    });

    render({ addon });
    expect(screen.getByText('Users: 0')).toBeInTheDocument();
  });

  it('displays ratings', () => {
    const average = 4.3;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      ratings: { average },
    });

    render({ addon });

    const ratings = screen.getAllByTitle(`Rated ${average} out of 5`);
    expect(ratings[0]).toHaveClass('Rating--small');
    expect(ratings).toHaveLength(6);
  });

  it('shows 0 ratings', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      ratings: {
        average: 0,
      },
    });

    render({ addon });

    expect(screen.getByText('There are no ratings yet')).toBeInTheDocument();
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
});
