/* @flow */
import config from 'config';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import invariant from 'invariant';

import { getCanonicalURL } from 'amo/utils';
import { hrefLangs } from 'core/languages';
import type { AppState } from 'amo/store';

type Props = {|
  prependClientApp?: boolean,
  to: string,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _hrefLangs: typeof hrefLangs,
  clientApp: string,
  currentURL: string,
  lang: string,
|};

export class HeadLinksBase extends React.PureComponent<InternalProps> {
  static defaultProps = {
    _config: config,
    _hrefLangs: hrefLangs,
    prependClientApp: true,
  };

  render() {
    const {
      _config,
      _hrefLangs,
      clientApp,
      currentURL,
      lang,
      prependClientApp,
      to,
    } = this.props;

    invariant(to.charAt(0) === '/', 'The `to` prop must start with a slash.');

    const hrefLangsMap = _config.get('hrefLangsMap');

    const path = prependClientApp ? `/${clientApp}${to}` : to;
    const canonicalURL = `/${lang}${path}`;

    const includeAlternateLinks =
      _config.get('unsupportedHrefLangs').includes(lang) === false &&
      canonicalURL === currentURL;

    return (
      <Helmet>
        <link
          rel="canonical"
          href={getCanonicalURL({ _config, locationPathname: canonicalURL })}
        />

        {includeAlternateLinks &&
          _hrefLangs.map((hrefLang) => {
            const locale = hrefLangsMap[hrefLang] || hrefLang;
            const locationPathname = `/${locale}${path}`;

            return (
              <link
                href={getCanonicalURL({ _config, locationPathname })}
                hrefLang={hrefLang}
                key={hrefLang}
                rel="alternate"
              />
            );
          })}
      </Helmet>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const { clientApp, lang } = state.api;
  const { pathname, search } = state.router.location;

  return {
    clientApp,
    currentURL: `${pathname}${search}`,
    lang,
  };
};

const HeadLinks: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  HeadLinksBase,
);

export default HeadLinks;
