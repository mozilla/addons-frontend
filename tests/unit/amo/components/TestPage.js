/* global window */
import config from 'config';
import * as React from 'react';
import { createEvent, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setViewContext } from 'amo/actions/viewContext';
import { logOutFromServer } from 'amo/api';
import Page from 'amo/components/Page';
import {
  GET_FIREFOX_BANNER_CLICK_ACTION,
  GET_FIREFOX_BANNER_DISMISS_ACTION,
  GET_FIREFOX_BANNER_DISMISS_CATEGORY,
  GET_FIREFOX_BANNER_UTM_CONTENT,
} from 'amo/components/GetFirefoxBanner';
import { GET_FIREFOX_BUTTON_CLICK_CATEGORY } from 'amo/components/GetFirefoxButton';
import {
  ADDONS_REVIEW,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  API_ERRORS_SESSION_EXPIRY,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'amo/constants';
import { setClientApp } from 'amo/reducers/api';
import { loadSiteStatus, loadedPageIsAnonymous } from 'amo/reducers/site';
import tracking from 'amo/tracking';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  createCapturedErrorHandler,
  createHistory,
  dispatchClientMetadata,
  dispatchSignInActions,
  getFakeLoggerWithJest as getFakeLogger,
  getMockConfig,
  mockMatchMedia,
  render as defaultRender,
  screen,
  userAgents,
} from 'tests/unit/helpers';

// We need to control the config, which is used by Header, but we are
// rendering the Page component, so we have to control it via mocking as
// opposed to injecting a _config prop.
jest.mock('config');

// We need this to avoid firing sendEvent during tests, which will throw.
// We are also asserting on the calling of sendEvent in some tests.
jest.mock('amo/tracking', () => ({
  sendEvent: jest.fn(),
}));

// We need to mock logOutFromServer as it is called directly and we want
// to assert about it.
jest.mock('amo/api', () => ({
  ...jest.requireActual('amo/api'),
  logOutFromServer: jest.fn().mockResolvedValue(),
}));

describe(__filename, () => {
  let store;

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  // We need to mock window.matchMedia or the code for the dropdown menu
  // throws when we interact with the menu.
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', mockMatchMedia);
  });

  const render = ({ history, location, children, ...props } = {}) => {
    const renderOptions = {
      history:
        history ||
        createHistory({
          initialEntries: [location || '/'],
        }),
      store,
    };

    return defaultRender(
      <Page {...props}>{children || <div>Some content</div>}</Page>,
      renderOptions,
    );
  };

  const _dispatchSignInActions = (props = {}) => {
    dispatchSignInActions({ store, ...props });
  };

  const _dispatchClientMetadata = (props = {}) => {
    dispatchClientMetadata({ ...props, store });
  };

  it('passes isHomePage to WrongPlatformWarning', () => {
    render({ isHomePage: true, showWrongPlatformWarning: true });

    expect(
      screen.getByRole('link', { name: 'visit our desktop site' }),
    ).toHaveAttribute('href', '/');
  });

  it('assigns a className to a page other than the home page', () => {
    render({ isHomePage: false });

    expect(screen.getByClassName('Page-not-homepage')).toBeInTheDocument();
  });

  it('does not assign an extra className to the home page', () => {
    render({ isHomePage: true });

    expect(
      screen.queryByClassName('Page-not-homepage'),
    ).not.toBeInTheDocument();
  });

  it('does not assign an extra className when there is a hero promo', () => {
    _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    render();

    expect(
      screen.queryByClassName('Page-no-hero-promo'),
    ).not.toBeInTheDocument();
  });

  it('assigns an extra className when it is the Android home page', () => {
    _dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    render();

    expect(screen.getByClassName('Page-no-hero-promo')).toBeInTheDocument();
  });

  it('renders an AppBanner if it is not the home page', () => {
    render({ isHomePage: false });

    expect(screen.getByClassName('AppBanner')).toBeInTheDocument();
  });

  it('renders an AppBanner if it is the home page and clientApp is `android`', () => {
    _dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    render({ isHomePage: true });

    expect(screen.getByClassName('AppBanner')).toBeInTheDocument();
  });

  it('renders children', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    render({ children });

    expect(screen.getByClassName(className)).toBeInTheDocument();
  });

  it('renders NotFound for missing add-on - 404 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 404 });
    render({ errorHandler });

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders NotFound for unauthorized add-on - 401 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 401 });
    render({ errorHandler });

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it.each(API_ERRORS_SESSION_EXPIRY)(
    'renders AuthFailed for 401 error with a session expiry code: %s',
    (code) => {
      const errorHandler = createCapturedErrorHandler({
        status: 401,
        detail: 'something',
        code,
      });
      render({ errorHandler });

      expect(screen.getByText('Login Expired')).toBeInTheDocument();
    },
  );

  it('renders NotFound for forbidden add-on - 403 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 403 });
    render({ errorHandler });

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders UnavailableForLegalReasons for unavailable add-on - 451 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 451 });
    render({ errorHandler });

    expect(
      screen.getByText('That page is not available in your region'),
    ).toBeInTheDocument();
  });

  it.each([401, 403, 404, 451])(
    'does not render children when there is a %s error',
    (status) => {
      const className = 'some-class-name';
      const children = <div className={className} />;
      const errorHandler = createCapturedErrorHandler({ status });
      render({ children, errorHandler });

      expect(screen.queryByClassName(className)).not.toBeInTheDocument();
    },
  );

  it.each([401, 403, 404, 451])(
    'logs a debug message when there is a %s error',
    (status) => {
      const _log = getFakeLogger();
      const message = 'Some error occured';
      const errorHandler = createCapturedErrorHandler({
        detail: message,
        status,
      });
      render({ _log, errorHandler });

      expect(_log.debug).toHaveBeenCalledWith(`Captured API Error: ${message}`);
    },
  );

  it('renders children when there is an uncaught error', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    const errorHandler = createCapturedErrorHandler({ status: 400 });
    render({ children, errorHandler });

    expect(screen.getByClassName(className)).toBeInTheDocument();
  });

  it('logs a warning message when there is an uncaught error', () => {
    const _log = getFakeLogger();
    const message = 'Some error occured';
    const errorHandler = createCapturedErrorHandler({
      detail: message,
      status: 400,
    });
    render({ _log, errorHandler });

    expect(_log.warn).toHaveBeenCalledWith(`Captured API Error: ${message}`);
  });

  describe('Tests for GetFirefoxBanner', () => {
    // Default props for all tests for GetFirefoxBanner, which will cause the
    // banner to appear.
    const props = { isAddonInstallPage: false };

    describe('Not firefox', () => {
      beforeEach(() => {
        _dispatchClientMetadata({ userAgent: userAgents.chrome[0] });
      });

      it('renders a GetFirefoxBanner if the browser is not Firefox', () => {
        render(props);

        expect(
          screen.getByRole('link', { name: 'download Firefox' }),
        ).toHaveClass('GetFirefoxBanner-button');
      });

      it('renders a dismissable warning Notice', () => {
        render(props);

        expect(screen.getByClassName('GetFirefoxBanner')).toHaveClass(
          'Notice-warning',
        );
        expect(screen.getByClassName('GetFirefoxBanner')).toHaveClass(
          'Notice-dismissible',
        );
      });

      it('has the expected text', () => {
        render(props);

        expect(
          screen.getByTextAcrossTags(
            `To use these add-ons, you'll need to download Firefox`,
          ),
        ).toBeInTheDocument();
      });

      it('sets the href on the button with the expected utm params', () => {
        render(props);

        const expectedHref = [
          `${DOWNLOAD_FIREFOX_BASE_URL}?s=direct`,
          `utm_campaign=${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}`,
          `utm_content=${GET_FIREFOX_BANNER_UTM_CONTENT}`,
          `utm_medium=referral&utm_source=addons.mozilla.org`,
        ].join('&');

        expect(
          screen.getByRole('link', { name: 'download Firefox' }),
        ).toHaveAttribute('href', expectedHref);
      });

      it('sends a tracking event when the button is clicked', () => {
        render(props);

        userEvent.click(screen.getByRole('link', { name: 'download Firefox' }));

        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(tracking.sendEvent).toHaveBeenCalledWith({
          action: GET_FIREFOX_BANNER_CLICK_ACTION,
          category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
        });
      });

      it('sends a tracking event when the banner is dismissed', () => {
        render(props);

        userEvent.click(
          screen.getByRole('button', { name: 'Dismiss this notice' }),
        );

        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(tracking.sendEvent).toHaveBeenCalledWith({
          action: GET_FIREFOX_BANNER_DISMISS_ACTION,
          category: GET_FIREFOX_BANNER_DISMISS_CATEGORY,
        });
      });
    });

    describe('On firefox', () => {
      it('does not render a download banner if the browser is Firefox Desktop', () => {
        _dispatchClientMetadata({ userAgent: userAgents.firefox[0] });
        render(props);

        expect(screen.queryByText('download Firefox')).not.toBeInTheDocument();
      });

      it('does not render a download banner if the browser is Firefox for Android', () => {
        _dispatchClientMetadata({ userAgent: userAgents.firefoxAndroid[0] });
        render(props);

        expect(screen.queryByText('download Firefox')).not.toBeInTheDocument();
      });

      it('does not render a download banner if the browser is Firefox for iOS', () => {
        _dispatchClientMetadata({ userAgent: userAgents.firefoxIOS[0] });
        render(props);

        expect(screen.queryByText('download Firefox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tests for Header', () => {
    it('renders an <h1> when isHomepage is true', () => {
      render({ isHomePage: true });

      expect(
        screen.getByRole('heading', { name: 'Firefox Browser Add-ons' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Firefox Browser Add-ons' }),
      ).toHaveAttribute('href', '/en-US/android/');
      expect(screen.getByRole('banner')).not.toHaveClass(
        'Header--loaded-page-is-anonymous',
      );
    });

    it('renders a download banner Banner when isAddonInstallPage is false', () => {
      _dispatchClientMetadata({ userAgent: userAgents.chrome[0] });

      render({ isAddonInstallPage: false });

      expect(screen.getByText('download Firefox')).toBeInTheDocument();
    });

    it('does not render a download banner Banner when isAddonInstallPage is true', () => {
      _dispatchClientMetadata({ userAgent: userAgents.chrome[0] });

      render({ isAddonInstallPage: true });

      expect(screen.queryByText('download Firefox')).not.toBeInTheDocument();
    });

    it('always renders a link in the header when not on homepage', () => {
      render({ isHomePage: false });

      expect(
        screen.queryByRole('heading', { name: 'Firefox Browser Add-ons' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Firefox Browser Add-ons' }),
      ).toHaveAttribute('href', '/en-US/android/');
    });

    it('displays `Log in` text when user is not signed in', () => {
      render();

      expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
      expect(screen.queryByText('My Account')).not.toBeInTheDocument();
    });

    it('displays a menu and the display name when user is signed in', () => {
      const displayName = 'King of the Elephants';
      _dispatchSignInActions({
        userProps: { display_name: displayName },
      });
      render();

      expect(
        screen.getByRole('button', { name: displayName }),
      ).toBeInTheDocument();
      expect(screen.getByText('My Account')).toBeInTheDocument();
    });

    it('displays the username when user is signed in but has no display name', () => {
      const username = 'babar';
      _dispatchSignInActions({ userProps: { username } });
      render();

      expect(
        screen.getByRole('button', { name: username }),
      ).toBeInTheDocument();
    });

    it('displays link to my collections when user is signed in', () => {
      _dispatchSignInActions();
      render();

      expect(screen.getByText('View My Collections')).toHaveAttribute(
        'href',
        '/en-US/android/collections/',
      );
    });

    it('displays a view profile link when user is signed in', () => {
      const id = 124;
      _dispatchSignInActions({ userProps: { id } });
      render();

      expect(screen.getByText('View My Profile')).toHaveAttribute(
        'href',
        `/en-US/android/user/${id}/`,
      );
    });

    it('displays an edit profile link when user is signed in', () => {
      _dispatchSignInActions();
      render();

      expect(screen.getByText('Edit My Profile')).toHaveAttribute(
        'href',
        '/en-US/android/users/edit',
      );
    });

    it('allows a signed-in user to log out', () => {
      _dispatchSignInActions();
      render();

      userEvent.click(screen.getByText('Log out'));

      expect(logOutFromServer).toHaveBeenCalledWith({
        api: store.getState().api,
      });
    });

    it('displays the reviewer tools link when user has a reviewer permission', () => {
      _dispatchSignInActions({
        userProps: {
          permissions: [ADDONS_REVIEW],
        },
      });
      render();

      expect(screen.getByText('Reviewer Tools')).toHaveAttribute(
        'href',
        '/en-US/reviewers/',
      );
    });

    it('does not display the reviewer tools link when user does not have permission', () => {
      _dispatchSignInActions();
      render();

      expect(screen.queryByText('Reviewer Tools')).not.toBeInTheDocument();
    });

    it('displays a "manage my submissions" link when user is logged in', () => {
      _dispatchSignInActions();
      render();

      expect(screen.getByText('Manage My Submissions')).toHaveAttribute(
        'href',
        '/en-US/developers/addons/',
      );
    });

    it('displays blog, devhub and extension workshop links in the header on Firefox', () => {
      const extensionWorkshopUrl = 'someFakeUrl';
      const fakeConfig = getMockConfig({ extensionWorkshopUrl });
      config.get.mockImplementation((key) => {
        return fakeConfig[key];
      });

      _dispatchClientMetadata({ userAgent: userAgents.firefox[0] });
      render();

      // The Extension Workshop and Developer Hub links in the header cannot
      // be found by role/name, probably because of the icon inside the <a>
      // tag, so we locate it by title instead.
      expect(
        screen.getByTitle('Submit and manage extensions and themes'),
      ).toHaveAttribute('href', '/en-US/developers/');

      expect(
        screen.getByTitle('Learn how to create extensions and themes'),
      ).toHaveAttribute(
        'href',
        `${extensionWorkshopUrl}/${makeQueryStringWithUTM({
          utm_content: 'header-link',
          utm_campaign: null,
        })}`,
      );

      // There are links to the blog in the header and the footer.
      const blogLinks = screen.queryAllByRole('link', {
        name: 'Firefox Add-ons Blog',
      });
      for (const link of blogLinks) {
        expect(link).toHaveAttribute('href', '/blog/');
      }
    });

    it('does not display links for devhub and extension workshop on non-Firefox', () => {
      _dispatchClientMetadata({ userAgent: userAgents.chrome[0] });

      render();

      expect(
        screen.queryByTitle('Submit and manage extensions and themes'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTitle('Learn how to create extensions and themes'),
      ).not.toBeInTheDocument();
    });

    it('disables the logout button when the site is in readonly mode', () => {
      _dispatchSignInActions();
      store.dispatch(loadSiteStatus({ readOnly: true, notice: null }));

      render();

      // getByRole('button') doesn't find this, even though it is a button
      // element with type="button".
      const logOutButton = screen.getByText('Log out');
      expect(logOutButton).toHaveAttribute('disabled');
      expect(logOutButton).toHaveAttribute(
        'title',
        'This action is currently unavailable. Please reload the page in a moment.',
      );
    });

    it('does not disable the logout button when the site is not in readonly mode', () => {
      _dispatchSignInActions();
      store.dispatch(loadSiteStatus({ readOnly: false, notice: null }));

      render();

      const logOutButton = screen.getByText('Log out');
      expect(logOutButton).not.toHaveAttribute('disabled');
      expect(logOutButton).not.toHaveAttribute('title');
    });

    it('does not render a menu when the loaded page is anonymous and user is logged in', () => {
      const name = 'user name';
      _dispatchSignInActions({ userProps: { name } });
      store.dispatch(loadedPageIsAnonymous());

      render();
      expect(screen.getByRole('banner')).toHaveClass(
        'Header--loaded-page-is-anonymous',
      );
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    });

    it('does not render navigation links for the mobile site', () => {
      _dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
      render();

      expect(
        screen.queryByRole('link', { name: 'Extensions' }),
      ).not.toBeInTheDocument();
    });

    it('adds a className to the search form for the desktop site', () => {
      _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
      render();

      expect(screen.getByRole('search')).toHaveClass(
        'Header-search-form--desktop',
      );
    });

    it('does not add a className to the search form for the mobile site', () => {
      _dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
      render();

      expect(screen.getByRole('search')).not.toHaveClass(
        'Header-search-form--desktop',
      );
    });

    describe('Tests for SectionLinks', () => {
      it('renders four sections on Firefox', () => {
        _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
        render();

        expect(
          screen.getByRole('link', { name: 'Extensions' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: 'Themes' }),
        ).toBeInTheDocument();
        // getByRole('link') does not find these, perhaps because they are in
        // a drop-down menu
        expect(
          screen.getByText('Dictionaries & Language Packs'),
        ).toHaveAttribute('href', '/en-US/firefox/language-tools/');
        expect(screen.getByText('Add-ons for Android')).toBeInTheDocument();
      });

      it('renders a DropdownMenu for the "More" section', () => {
        _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
        render();

        expect(
          screen.getByRole('button', { name: 'More…' }),
        ).toBeInTheDocument();
      });

      it('renders Extensions active when addonType is extensions', () => {
        _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
        store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));
        render();

        expect(screen.getByRole('link', { name: 'Extensions' })).toHaveClass(
          'SectionLinks-link--active',
        );
      });

      it('renders Themes active when add-on is a static theme', () => {
        _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
        store.dispatch(setViewContext(ADDON_TYPE_STATIC_THEME));
        render();

        expect(screen.getByRole('link', { name: 'Themes' })).toHaveClass(
          'SectionLinks-link--active',
        );
      });

      it('renders Language Tools active when viewContext is languageTools', () => {
        _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
        store.dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));
        render();

        expect(screen.getByText('Dictionaries & Language Packs')).toHaveClass(
          'SectionLinks-dropdownlink--active',
        );
      });

      it('shows Firefox name and hides link in header on Desktop', () => {
        _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
        store.dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));
        render();

        expect(screen.getByText('for Firefox')).toBeInTheDocument();
        expect(
          screen.queryByClassName(
            `SectionLinks-clientApp-${CLIENT_APP_ANDROID}`,
          ),
        ).toHaveTextContent('Add-ons for Android');
        expect(
          screen.queryByClassName(
            `SectionLinks-clientApp-${CLIENT_APP_FIREFOX}`,
          ),
        ).not.toBeInTheDocument();
      });

      it('changes clientApp when different site link clicked', () => {
        _dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
        const dispatch = jest.spyOn(store, 'dispatch');
        const history = createHistory();
        render({ history });

        const pushSpy = jest.spyOn(history, 'push');
        const link = screen.getByText('Add-ons for Android');
        const clickEvent = createEvent.click(link);

        fireEvent(link, clickEvent);

        expect(dispatch).toHaveBeenCalledWith(setClientApp(CLIENT_APP_ANDROID));
        expect(clickEvent.defaultPrevented).toBeTruthy();
        expect(pushSpy).toHaveBeenCalledWith(`/en-US/${CLIENT_APP_ANDROID}/`);
      });
    });
  });
});
