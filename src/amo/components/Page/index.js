/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import AppBanner from 'amo/components/AppBanner';
import Footer from 'amo/components/Footer';
import Header from 'amo/components/Header';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import InfoDialog from 'core/components/InfoDialog';
import { CLIENT_APP_ANDROID } from 'core/constants';
import type { AppState } from 'amo/store';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  children: React.Node,
  isHomePage?: boolean,
  showWrongPlatformWarning?: boolean,
|};

type InternalProps = {|
  ...Props,
  clientApp: string,
  location: ReactRouterLocationType,
|};

export const PageBase = ({
  children,
  clientApp,
  isHomePage = false,
  location,
  showWrongPlatformWarning = true,
}: InternalProps) => {
  return (
    <div className="Page-amo">
      <InfoDialog />

      <Header isHomePage={isHomePage} location={location} />

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
          {showWrongPlatformWarning && <WrongPlatformWarning />}
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
  };
};

const Page: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
)(PageBase);

export default Page;
