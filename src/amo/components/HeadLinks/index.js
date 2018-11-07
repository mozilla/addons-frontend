/* @flow */
import config from 'config';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCanonicalURL } from 'amo/utils';
import { hrefLangs } from 'core/languages';
import type { AppState } from 'amo/store';

type Props = {||};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _hrefLangs: typeof hrefLangs,
  currentURL: string,
  lang: string,
  locationPathname: string,
|};

export class HeadLinksBase extends React.PureComponent<InternalProps> {
  static defaultProps = {
    _config: config,
    _hrefLangs: hrefLangs,
  };

  render() {
    const {
      _config,
      _hrefLangs,
      currentURL,
      lang,
      locationPathname,
    } = this.props;

    const urlWithoutLocale = locationPathname
      .split('/')
      .slice(2)
      .join('/');
    const canonicalURL = `/${lang}/${urlWithoutLocale}`;

    const hrefLangsMap = _config.get('hrefLangsMap');
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
            const alternateURL = `/${locale}/${urlWithoutLocale}`;

            return (
              <link
                href={getCanonicalURL({
                  _config,
                  locationPathname: alternateURL,
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
  const { lang } = state.api;
  const { pathname, search } = state.router.location;

  return {
    currentURL: `${pathname}${search}`,
    lang,
    locationPathname: pathname,
  };
};

const HeadLinks: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  HeadLinksBase,
);

export default HeadLinks;
