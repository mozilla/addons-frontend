import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import NestedStatus from 'react-nested-status';
import { compose } from 'redux';
import makeClassName from 'classnames';

import DefaultErrorPage from 'core/components/ErrorPage';
import translate from 'core/i18n/translate';
import Footer from 'disco/components/Footer';

import 'disco/css/App.scss';


export class AppBase extends React.Component {
  static propTypes = {
    ErrorPage: PropTypes.node,
    browserVersion: PropTypes.string.isRequired,
    children: PropTypes.node,
    i18n: PropTypes.object.isRequired,
  }

  static defaultProps = {
    ErrorPage: DefaultErrorPage,
  }

  render() {
    const { ErrorPage, browserVersion, children, i18n } = this.props;
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
            {children}
          </ErrorPage>
          <Footer />
        </div>
      </NestedStatus>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  return {
    browserVersion: ownProps.params.version,
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AppBase);
