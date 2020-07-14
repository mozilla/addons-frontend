import * as React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { matchPath, withRouter } from 'react-router-dom';
import NestedStatus from 'react-nested-status';
import { compose } from 'redux';
import makeClassName from 'classnames';

// We have to import these styles first to have them listed first in the final
// CSS file. See: https://github.com/mozilla/addons-frontend/issues/3565
import 'normalize.css/normalize.css';
import './styles.scss';

/* eslint-disable import/first */
import DefaultErrorPage from 'core/components/ErrorPage';
import Footer from 'disco/components/Footer';
import Routes, { DISCO_PANE_PATH } from 'disco/components/Routes';
import translate from 'core/i18n/translate';
/* eslint-enable import/first */

export class AppBase extends React.Component {
  static propTypes = {
    ErrorPage: PropTypes.func,
    browserVersion: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
  };

  static defaultProps = {
    ErrorPage: DefaultErrorPage,
  };

  render() {
    const { ErrorPage, browserVersion, i18n } = this.props;

    const classes = makeClassName('App', {
      'App--padding-compensation': parseInt(browserVersion, 10) < 50,
    });

    return (
      <NestedStatus code={200}>
        <div className={classes}>
          <Helmet defaultTitle={i18n.gettext('Discover Add-ons')}>
            <meta name="robots" content="noindex" />
          </Helmet>

          <ErrorPage>
            <Routes />
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
    browserVersion: match ? match.params.version : '',
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(AppBase);
