import path from 'path';

import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';


export class LinkBase extends React.Component {
  static propTypes = {
    base: PropTypes.string,
    children: PropTypes.node,
    to: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }

  static defaultProps = {
    base: '',
  }

  render() {
    const { base, children, to } = this.props;

    let linkTo = to;
    if (typeof to === 'string' && to.startsWith('/')) {
      linkTo = path.join(base, to);
    } else if (to && to.pathname) {
      linkTo = {
        ...to,
        pathname: to.pathname.startsWith('/') ?
          path.join(base, to.pathname) : to.pathname,
      };
    }

    return <Link {...this.props} to={linkTo}>{children}</Link>;
  }
}

export function mapStateToProps(state) {
  return {
    base: `/${state.api.lang}/${state.api.clientApp}`,
  };
}

export default compose(
  connect(mapStateToProps),
)(LinkBase);
