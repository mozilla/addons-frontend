import config from 'config';
import * as React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { matchPath, withRouter, Route, Switch } from 'react-router-dom';
import NestedStatus from 'react-nested-status';
import { compose } from 'redux';
import makeClassName from 'classnames';

import DefaultErrorPage from 'core/components/ErrorPage';
import GenericError from 'core/components/ErrorPage/GenericError';
import NotFound from 'core/components/ErrorPage/NotFound';
import SimulateAsyncError from 'core/components/error-simulation/SimulateAsyncError';
import SimulateClientError from 'core/components/error-simulation/SimulateClientError';
import SimulateSyncError from 'core/components/error-simulation/SimulateSyncError';
import translate from 'core/i18n/translate';
import DiscoPane from 'disco/components/DiscoPane';
import Footer from 'disco/components/Footer';

import './styles.scss';

const DISCO_PANE_PATH =
  '/:lang/firefox/discovery/pane/:version/:platform/:compatibilityMode';

export class AppBase extends React.Component {
  static propTypes = {
    ErrorPage: PropTypes.node,
    browserVersion: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
  };

  static defaultProps = {
    ErrorPage: DefaultErrorPage,
  };

  render() {
    const { ErrorPage, browserVersion, i18n } = this.props;

    const classes = makeClassName('disco-pane', {
      'padding-compensation': parseInt(browserVersion, 10) < 50,
    });

    return (
      <NestedStatus code={200}>
        <div className={classes}>
          <Helmet defaultTitle={i18n.gettext('Discover Add-ons')}>
            <meta name="robots" content="noindex" />
          </Helmet>

          <ErrorPage>
            <Switch>
              <Route exact path={DISCO_PANE_PATH} component={DiscoPane} />
              <Route exact path="/:lang/firefox/404" component={NotFound} />
              <Route
                exact
                path="/:lang/firefox/500"
                component={
                  config.get('isDevelopment') ? GenericError : NotFound
                }
              />
              <Route
                exact
                path="/:lang/:app/simulate-async-error/"
                component={SimulateAsyncError}
              />
              <Route
                exact
                path="/:lang/:app/simulate-client-error/"
                component={SimulateClientError}
              />
              <Route
                exact
                path="/:lang/:app/simulate-sync-error/"
                component={SimulateSyncError}
              />
              <Route component={NotFound} />
            </Switch>
          </ErrorPage>

          <Footer />
        </div>
      </NestedStatus>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const match = matchPath(ownProps.location.pathname, {
    path: DISCO_PANE_PATH,
    exact: true,
  });

  return {
    browserVersion: match.params.version,
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(AppBase);
