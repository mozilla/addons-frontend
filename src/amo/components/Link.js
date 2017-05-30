import path from 'path';

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';


export class LinkBase extends React.Component {
  static propTypes = {
    base: PropTypes.string,
    children: PropTypes.node,
    href: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }

  static defaultProps = {
    base: '',
  }

  render() {
    const { base, children, href, to, ...customProps } = this.props;

    if (typeof href === 'string' && typeof to !== 'undefined') {
      throw new Error(
        'Cannot use "href" prop and "to" prop in the same Link component');
    }

    if (typeof href === 'string') {
      const linkHref = href.startsWith('/') ? path.join(base, href) : href;
      return <a {...customProps} href={linkHref}>{children}</a>;
    }

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

    return <Link {...customProps} to={linkTo}>{children}</Link>;
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
