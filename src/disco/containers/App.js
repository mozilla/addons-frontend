import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';
import mozVersionCompare from 'mozilla-version-comparator';

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
      /*
       * mozVersionCompare(v1, v2) returns:
       * 0 if the two versions are considered equal.
       * -1 if v1 is less than v2
       * 1 if v1 is greater than v2
       */
      'padding-compensation': mozVersionCompare(browserVersion || '', '50') === -1,
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
