/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import AppBanner from 'amo/components/AppBanner';
import NotFound from 'amo/components/Errors/NotFound';
import UnavailableForLegalReasons from 'amo/components/Errors/UnavailableForLegalReasons';
import Footer from 'amo/components/Footer';
import Header from 'amo/components/Header';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import InfoDialog from 'amo/components/InfoDialog';
import { CLIENT_APP_ANDROID } from 'amo/constants';
import log from 'amo/logger';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  children: React.Node,
  errorHandler?: ErrorHandlerType,
  isAddonDetailPage?: boolean,
  isHomePage?: boolean,
  showWrongPlatformWarning?: boolean,
|};

type PropsFromState = {|
  clientApp: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  _log: typeof log,
  location: ReactRouterLocationType,
|};

export const PageBase = ({
  _log = log,
  children,
  clientApp,
  errorHandler,
  isAddonDetailPage = false,
  isHomePage = false,
  location,
  showWrongPlatformWarning = true,
}: InternalProps): React.Node => {
  let errorContent;
  if (errorHandler && errorHandler.hasError()) {
    // 401 and 403 for an add-on lookup is made to look like a 404 on purpose.
    // See https://github.com/mozilla/addons-frontend/issues/3061
    if (
      errorHandler.capturedError.responseStatusCode === 401 ||
      errorHandler.capturedError.responseStatusCode === 403 ||
      errorHandler.capturedError.responseStatusCode === 404
    ) {
      errorContent = <NotFound />;
    } else if (errorHandler.capturedError.responseStatusCode === 451) {
      errorContent = <UnavailableForLegalReasons />;
    }

    const logMessage = `Captured API Error: ${errorHandler.capturedError.messages}`;
    if (errorContent) {
      _log.debug(logMessage);
    } else {
      // This is a string, silly eslint.
      // eslint-disable-next-line amo/only-log-strings
      _log.warn(logMessage);
    }
  }

  return (
    <div className="Page-amo">
      <InfoDialog />

      <Header
        isAddonDetailPage={isAddonDetailPage}
        isHomePage={isHomePage}
        location={location}
      />

      <div className="Page-content">
        <div
          className={makeClassName('Page', {
            'Page-not-homepage': !isHomePage,
            'Page-no-hero-promo': clientApp === CLIENT_APP_ANDROID,
          })}
        >
          {
            // Exclude the AppBanner from the home page, but include it on the
            // Android home page.
            (!isHomePage || clientApp === CLIENT_APP_ANDROID) && <AppBanner />
          }
          {showWrongPlatformWarning && (
            <WrongPlatformWarning isHomePage={isHomePage} />
          )}
          {errorContent || children}
        </div>
      </div>

      <Footer />
    </div>
  );
};

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    clientApp: state.api.clientApp,
  };
};

const Page: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
)(PageBase);

export default Page;
