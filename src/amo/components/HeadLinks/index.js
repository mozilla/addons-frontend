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
  to: string,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _hrefLangs: typeof hrefLangs,
  clientApp: string,
  lang: string,
|};

export class HeadLinksBase extends React.PureComponent<InternalProps> {
  static defaultProps = {
    _config: config,
    _hrefLangs: hrefLangs,
  };

  render() {
    const { _config, _hrefLangs, clientApp, lang, to } = this.props;

    invariant(to.charAt(0) === '/', 'The `to` prop must start with a slash.');

    const includeAlternateLinks =
      _config.get('unsupportedHrefLangs').includes(lang) === false;
    const hrefLangsMap = _config.get('hrefLangsMap');

    return (
      <Helmet>
        <link
          rel="canonical"
          href={getCanonicalURL({
            _config,
            locationPathname: `/${lang}/${clientApp}${to}`,
          })}
        />

        {includeAlternateLinks &&
          _hrefLangs.map((hrefLang) => {
            const locale = hrefLangsMap[hrefLang] || hrefLang;

            return (
              <link
                href={getCanonicalURL({
                  _config,
                  locationPathname: `/${locale}/${clientApp}${to}`,
                })}
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

  return {
    clientApp,
    lang,
  };
};

const HeadLinks: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  HeadLinksBase,
);

export default HeadLinks;
