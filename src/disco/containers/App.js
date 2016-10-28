import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';

import 'disco/css/App.scss';
import translate from 'core/i18n/translate';


export class AppBase extends React.Component {
  static propTypes = {
    browserVersion: PropTypes.string.isRequired,
    children: PropTypes.node,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { browserVersion, children, i18n } = this.props;
    const classes = classNames('disco-pane', {
      'padding-compensation': parseInt(browserVersion, 10) < 50,
    });

    return (
      <div className={classes}>
        <Helmet
          defaultTitle={i18n.gettext('Discover Add-ons')}
          meta={[
            { name: 'robots', content: 'noindex' },
          ]}
        />
        {children}
      </div>
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
