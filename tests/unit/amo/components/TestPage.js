import * as React from 'react';

import Page, { PageBase } from 'amo/components/Page';
import AppBanner from 'amo/components/AppBanner';
import NotFound from 'amo/components/Errors/NotFound';
import UnavailableForLegalReasons from 'amo/components/Errors/UnavailableForLegalReasons';
import Header from 'amo/components/Header';
import VPNPromoBanner from 'amo/components/VPNPromoBanner';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  createCapturedErrorHandler,
  createContextWithFakeRouter,
  dispatchClientMetadata,
  getFakeLogger,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      children: <div>Some content</div>,
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(<Page {...allProps} />, PageBase, {
      shallowOptions: createContextWithFakeRouter(),
    });
  };

  it('passes isHomePage to Header', () => {
    const isHomePage = true;

    const root = render({ isHomePage });

    expect(root.find(Header)).toHaveProp('isHomePage', isHomePage);
  });

  it('passes isAddonInstallPage to Header', () => {
    const isAddonInstallPage = true;

    const root = render({ isAddonInstallPage });

    expect(root.find(Header)).toHaveProp(
      'isAddonInstallPage',
      isAddonInstallPage,
    );
  });

  it('passes isHomePage to WrongPlatformWarning', () => {
    const isHomePage = true;

    const root = render({ isHomePage });

    expect(root.find(WrongPlatformWarning)).toHaveProp(
      'isHomePage',
      isHomePage,
    );
  });

  it('assigns a className to a page other than the home page', () => {
    const root = render({ isHomePage: false });

    expect(root.find('.Page-not-homepage')).toHaveLength(1);
  });

  it('does not assign an extra className to the home page', () => {
    const root = render({ isHomePage: true });

    expect(root.find('.Page-not-homepage')).toHaveLength(0);
  });

  it('does not assign an extra className when there is a hero promo', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const root = render({ store });
    expect(root.find('.Page-no-hero-promo')).toHaveLength(0);
  });

  it('assigns an extra className when it is the Android home page', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });

    const root = render({ store });

    expect(root.find('.Page-no-hero-promo')).toHaveLength(1);
  });

  it('renders an AppBanner if it is not the home page', () => {
    const root = render({ isHomePage: false });

    expect(root.find(AppBanner)).toHaveLength(1);
  });

  it('renders an AppBanner if it is the home page and clientApp is `android`', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = render({ isHomePage: true, store });

    expect(root.find(AppBanner)).toHaveLength(1);
  });

  it('renders a VPNPromoBanner if showVPNPromo is true and clientApp is not `android`', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const root = render({ showVPNPromo: true, store });

    expect(root.find(VPNPromoBanner)).toHaveLength(1);
  });

  it('does not render a VPNPromoBanner if showVPNPromo is false', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const root = render({ showVPNPromo: false, store });

    expect(root.find(VPNPromoBanner)).toHaveLength(0);
  });

  it('does not render a VPNPromoBanner if clientApp is `android`', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = render({ showVPNPromo: true, store });

    expect(root.find(VPNPromoBanner)).toHaveLength(0);
  });

  it('renders children', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    const root = render({ children });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('renders NotFound for missing add-on - 404 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 404 });

    const root = render({ errorHandler });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders NotFound for unauthorized add-on - 401 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 401 });

    const root = render({ errorHandler });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders NotFound for forbidden add-on - 403 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 403 });

    const root = render({ errorHandler });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders UnavailableForLegalReasons for unavailable add-on - 451 error', () => {
    const errorHandler = createCapturedErrorHandler({ status: 451 });

    const root = render({ errorHandler });
    expect(root.find(UnavailableForLegalReasons)).toHaveLength(1);
  });

  it.each([401, 403, 404, 451])(
    'does not render children when there is a %s error',
    (status) => {
      const className = 'some-class-name';
      const children = <div className={className} />;
      const errorHandler = createCapturedErrorHandler({ status });
      const root = render({ children, errorHandler });

      expect(root.find(`.${className}`)).toHaveLength(0);
    },
  );

  it.each([401, 403, 404, 451])(
    'logs a debug message when there is a %s error',
    (status) => {
      const _log = getFakeLogger();
      const message = 'Some error occured';
      const errorHandler = createCapturedErrorHandler({ message, status });
      render({ _log, errorHandler });

      sinon.assert.calledWith(_log.debug, `Captured API Error: ${message}`);
    },
  );

  it('renders children when there is an uncaught error', () => {
    const className = 'some-class-name';
    const children = <div className={className} />;
    const errorHandler = createCapturedErrorHandler({ status: 400 });
    const root = render({ children, errorHandler });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('logs a warning message when there is an uncaught error', () => {
    const _log = getFakeLogger();
    const message = 'Some error occured';
    const errorHandler = createCapturedErrorHandler({ message, status: 400 });
    render({ _log, errorHandler });

    sinon.assert.calledWith(_log.warn, `Captured API Error: ${message}`);
  });
});
