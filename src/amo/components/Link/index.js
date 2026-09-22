import joinUrl from 'join-url';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Icon from 'amo/components/Icon';
import { CLIENT_APP_FIREFOX } from 'amo/constants';

export class LinkBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    external: PropTypes.bool,
    externalDark: PropTypes.bool,
    href: PropTypes.string,
    lang: PropTypes.string.isRequired,
    prependClientApp: PropTypes.bool,
    prependLang: PropTypes.bool,
    target: PropTypes.string,
    title: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  };

  static defaultProps = {
    external: false,
    externalDark: false,
    prependClientApp: true,
    prependLang: true,
  };

  urlPrefix({ lang, prependClientApp, prependLang } = {}) {
    const prefix = [];
    if (prependLang) {
      prefix.push(lang);
    }
    if (prependClientApp) {
      // All internal URLs reference `/firefox/`, regardless of the effective
      // clientApp. `/firefox/` pages adapt to Android devices at render time.
      prefix.push(CLIENT_APP_FIREFOX);
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
      children,
      dispatch,
      external,
      externalDark,
      href,
      lang,
      prependClientApp,
      prependLang,
      to,
      title,
      target,
      ...customProps
    } = this.props;

    const urlPrefix = this.urlPrefix({
      lang,
      prependClientApp,
      prependLang,
    });

    const createLinkDest = (urlString) => {
      return urlPrefix && !urlString.startsWith(urlPrefix)
        ? joinUrl.pathname(urlPrefix, urlString)
        : urlString;
    };

    const needsExternalIcon = externalDark || external;
    const iconName = externalDark ? 'external-dark' : 'external';

    if (typeof href === 'string' && typeof to !== 'undefined') {
      throw new Error(
        'Cannot use "href" prop and "to" prop in the same Link component',
      );
    }

    if (
      typeof to !== 'undefined' &&
      ((typeof to === 'string' && !to.startsWith('/')) ||
        (to && to.pathname && !to.pathname.startsWith('/')))
    ) {
      throw new Error(
        '"to" prop cannot contain a relative path; it must start with a "/".',
      );
    }

    const linkProps = {
      ...customProps,
      target,
      title,
      rel: target === '_blank' ? 'noopener noreferrer' : customProps.rel,
    };

    if (typeof href === 'string') {
      return (
        <a {...linkProps} href={createLinkDest(href)}>
          {children}
          {needsExternalIcon ? <Icon name={iconName} /> : null}
        </a>
      );
    }

    let linkTo = to;
    if (typeof to === 'string') {
      linkTo = createLinkDest(to);
    } else if (to && to.pathname) {
      linkTo = {
        ...to,
        pathname: createLinkDest(to.pathname),
      };
    }

    return (
      <Link {...linkProps} to={linkTo}>
        {children}
        {needsExternalIcon ? <Icon name={iconName} /> : null}
      </Link>
    );
  }
}

function mapStateToProps(state) {
  return {
    lang: state.api.lang,
  };
}

export default compose(connect(mapStateToProps))(LinkBase);
