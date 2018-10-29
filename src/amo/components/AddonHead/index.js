/* @flow */
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import HrefLang from 'amo/components/HrefLang';
import { getCanonicalURL } from 'amo/utils';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { getPreviewImage } from 'core/imageUtils';
import { getAddonJsonLinkedData } from 'core/utils/addons';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { AddonType } from 'core/types/addons';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  clientApp: string,
  i18n: I18nType,
  lang: string,
  locationPathname: string,
|};

export class AddonHeadBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
  };

  getPageTitle() {
    const { addon, clientApp, i18n, lang } = this.props;

    invariant(addon, 'addon is required');

    const i18nValues = {
      addonName: addon.name,
      locale: lang,
    };

    let localizedTitle;
    if (clientApp === CLIENT_APP_ANDROID) {
      switch (addon.type) {
        case ADDON_TYPE_DICT:
          // translators: please keep the fox emoji next to "Firefox Android".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Dictionary
            for 🦊 Firefox Android (%(locale)s)`);
          break;
        case ADDON_TYPE_EXTENSION:
          // translators: please keep the fox emoji next to "Firefox Android".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Extension for
            🦊 Firefox Android (%(locale)s)`);
          break;
        case ADDON_TYPE_LANG:
          // translators: please keep the fox emoji next to "Firefox Android".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Language Pack
            for 🦊 Firefox Android (%(locale)s)`);
          break;
        case ADDON_TYPE_STATIC_THEME:
        case ADDON_TYPE_THEME:
          // translators: please keep the fox emoji next to "Firefox Android".
          localizedTitle = i18n.gettext(
            `%(addonName)s – Get this Theme for 🦊 Firefox Android (%(locale)s)`,
          );
          break;
        case ADDON_TYPE_OPENSEARCH:
          // translators: please keep the fox emoji next to "Firefox Android".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Search Tool
            for 🦊 Firefox Android (%(locale)s)`);
          break;
        default:
          // translators: please keep the fox emoji next to "Firefox Android".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Add-on for 🦊
            Firefox Android (%(locale)s)`);
      }
    } else {
      switch (addon.type) {
        case ADDON_TYPE_DICT:
          // translators: please keep the fox emoji next to "Firefox".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Dictionary
            for 🦊 Firefox (%(locale)s)`);
          break;
        case ADDON_TYPE_EXTENSION:
          // translators: please keep the fox emoji next to "Firefox".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Extension for
            🦊 Firefox (%(locale)s)`);
          break;
        case ADDON_TYPE_LANG:
          // translators: please keep the fox emoji next to "Firefox".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Language Pack
            for 🦊 Firefox (%(locale)s)`);
          break;
        case ADDON_TYPE_STATIC_THEME:
        case ADDON_TYPE_THEME:
          // translators: please keep the fox emoji next to "Firefox".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Theme for 🦊
            Firefox (%(locale)s)`);
          break;
        case ADDON_TYPE_OPENSEARCH:
          // translators: please keep the fox emoji next to "Firefox".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Search Tool
            for 🦊 Firefox (%(locale)s)`);
          break;
        default:
          // translators: please keep the fox emoji next to "Firefox".
          localizedTitle = i18n.gettext(`%(addonName)s – Get this Add-on for 🦊
            Firefox (%(locale)s)`);
      }
    }

    return i18n.sprintf(localizedTitle, i18nValues);
  }

  getPageDescription() {
    const { addon, i18n } = this.props;

    invariant(addon, 'addon is required');

    return i18n.sprintf(
      i18n.gettext('Download %(addonName)s for Firefox. %(summary)s'),
      {
        addonName: addon.name,
        summary: addon.summary,
      },
    );
  }

  renderMetaOpenGraph() {
    const { addon, lang } = this.props;

    invariant(addon, 'addon is required');

    const tags = [
      <meta key="og:type" property="og:type" content="website" />,
      <meta key="og:url" property="og:url" content={addon.url} />,
      <meta key="og:title" property="og:title" content={this.getPageTitle()} />,
      <meta
        key="og:description"
        property="og:description"
        content={this.getPageDescription()}
      />,
      <meta key="og:locale" property="og:locale" content={lang} />,
    ];

    const image = addon.themeData
      ? addon.themeData.previewURL
      : getPreviewImage(addon);

    if (image) {
      tags.push(<meta key="og:image" property="og:image" content={image} />);
    }

    return tags;
  }

  render() {
    const { _config, addon, locationPathname } = this.props;

    if (!addon) {
      return null;
    }

    return (
      <React.Fragment>
        <Helmet titleTemplate={null}>
          <title>{this.getPageTitle()}</title>

          <link
            rel="canonical"
            href={getCanonicalURL({ locationPathname, _config })}
          />

          <meta name="description" content={this.getPageDescription()} />
          <meta name="date" content={addon.created} />
          {addon.last_updated && (
            <meta name="last-modified" content={addon.last_updated} />
          )}
          {this.renderMetaOpenGraph()}

          <script type="application/ld+json">
            {JSON.stringify(getAddonJsonLinkedData({ addon }))}
          </script>
        </Helmet>

        <HrefLang to={`/addon/${addon.slug}/`} />
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const { clientApp, lang } = state.api;
  const locationPathname = state.router.location.pathname;

  return {
    clientApp,
    lang,
    locationPathname,
  };
};

const AddonHead: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(AddonHeadBase);

export default AddonHead;
