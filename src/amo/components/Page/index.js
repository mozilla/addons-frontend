/* @flow */
import makeClassName from 'classnames';
import config from 'config';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import AppBanner from 'amo/components/AppBanner';
import AuthExpired from 'amo/components/Errors/AuthExpired';
import NotFound from 'amo/components/Errors/NotFound';
import UnavailableForLegalReasons from 'amo/components/Errors/UnavailableForLegalReasons';
import Footer from 'amo/components/Footer';
import Header from 'amo/components/Header';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import VPNPromoBanner from 'amo/components/VPNPromoBanner';
import { API_ERRORS_SESSION_EXPIRY, CLIENT_APP_ANDROID } from 'amo/constants';
import { EXPERIMENT_CONFIG } from 'amo/experiments/20210714_amo_vpn_promo';
import log from 'amo/logger';
import { withExperiment } from 'amo/withExperiment';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { ReactRouterLocationType } from 'amo/types/router';
import type { WithExperimentInjectedProps } from 'amo/withExperiment';

import './styles.scss';

type Props = {|
  children: React.Node,
  errorHandler?: ErrorHandlerType,
  includeGoogleDisclaimerInFooter?: boolean,
  isAddonInstallPage?: boolean,
  isHomePage?: boolean,
  showVPNPromo?: boolean,
  showWrongPlatformWarning?: boolean,
|};

type PropsFromState = {|
  clientApp: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...WithExperimentInjectedProps,
  _config: typeof config,
  _log: typeof log,
  location: ReactRouterLocationType,
|};

export const PageBase = ({
  _config = config,
  _log = log,
  children,
  clientApp,
  errorHandler,
  includeGoogleDisclaimerInFooter,
  isAddonInstallPage = false,
  isHomePage = false,
  location,
  showVPNPromo = false,
  showWrongPlatformWarning = true,
  variant,
}: InternalProps): React.Node => {
  let errorContent;
  if (errorHandler && errorHandler.hasError()) {
    // 401 and 403 for an add-on lookup is made to look like a 404 on purpose.
    // See https://github.com/mozilla/addons-frontend/issues/3061
    if (
      errorHandler.capturedError.responseStatusCode === 401 &&
      API_ERRORS_SESSION_EXPIRY.includes(errorHandler.capturedError.code)
    ) {
      errorContent = <AuthExpired />;
    } else if (
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
      {showVPNPromo && _config.get('enableFeatureVPNPromo') && (
        <VPNPromoBanner variant={variant} />
      )}

      <Header
        isAddonInstallPage={isAddonInstallPage}
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
            <WrongPlatformWarning
              className="Page-WrongPlatformWarning"
              isHomePage={isHomePage}
            />
          )}

          {errorContent || children}
        </div>
      </div>

      <Footer includeGoogleDisclaimer={includeGoogleDisclaimerInFooter} />
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
  withExperiment({ experimentConfig: EXPERIMENT_CONFIG }),
)(PageBase);

export default Page;
