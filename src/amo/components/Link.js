import joinUrl from 'join-url';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import Icon from 'ui/components/Icon';


export class LinkBase extends React.Component {
  static propTypes = {
    blackIcon: PropTypes.bool,
    className: PropTypes.string,
    clientApp: PropTypes.string.isRequired,
    children: PropTypes.node,
    external: PropTypes.bool,
    href: PropTypes.string,
    lang: PropTypes.string.isRequired,
    prependClientApp: PropTypes.bool,
    prependLang: PropTypes.bool,
    to: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }

  static defaultProps = {
    blackIcon: false,
    external: false,
    prependClientApp: true,
    prependLang: true,
  }

  urlPrefix({ clientApp, lang, prependClientApp, prependLang } = {}) {
    const prefix = [];
    if (prependLang) {
      prefix.push(lang);
    }
    if (prependClientApp) {
      prefix.push(clientApp);
    }
    if (prefix.length) {
      return `/${prefix.join('/')}/`;
    }

    // If no prefixes should be applied we'll return null and pass the
    // path through to an <a> tag or <Link> component.
    return null;
  }

  render() {
    const {
      blackIcon,
      clientApp,
      children,
      external,
      href,
      lang,
      prependClientApp,
      prependLang,
      to,
      ...customProps
    } = this.props;
    const urlPrefix = this.urlPrefix({
      clientApp, lang, prependClientApp, prependLang });

    if (typeof href === 'string' && typeof to !== 'undefined') {
      throw new Error(
        'Cannot use "href" prop and "to" prop in the same Link component');
    }

    if (
      typeof to !== 'undefined' && (
        (typeof to === 'string' && !to.startsWith('/')) ||
        (to && to.pathname && !to.pathname.startsWith('/'))
      )
    ) {
      throw new Error(
        '"to" prop cannot contain a relative path; it must start with a "/".');
    }

    if (typeof href === 'string') {
      const linkHref = urlPrefix ? joinUrl.pathname(urlPrefix, href) : href;
      return (
        <a {...customProps} href={linkHref}>
          {children}
          {external ? <Icon name={blackIcon ? 'external-black' : 'external'} /> : null}
        </a>
      );
    }

    let linkTo = to;
    if (typeof to === 'string') {
      linkTo = urlPrefix ? joinUrl.pathname(urlPrefix, to) : to;
    } else if (to && to.pathname) {
      linkTo = {
        ...to,
        pathname: urlPrefix ?
          joinUrl.pathname(urlPrefix, to.pathname) : to.pathname,
      };
    }

    return (
      <Link {...customProps} to={linkTo}>
        {children}
        {external ? <Icon name={blackIcon ? 'external-black' : 'external'} /> : null}
      </Link>
    );
  }
}

export function mapStateToProps(state) {
  return { clientApp: state.api.clientApp, lang: state.api.lang };
}

export default compose(
  connect(mapStateToProps),
)(LinkBase);
