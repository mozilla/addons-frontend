/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
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
import { getVersionById } from 'core/reducers/versions';
import { getAddonJsonLinkedData } from 'core/utils/addons';
import type { AppState } from 'amo/store';
import type { AddonVersionType } from 'core/reducers/versions';
import type { I18nType } from 'core/types/i18n';
import type { AddonType } from 'core/types/addons';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  _getAddonJsonLinkedData: typeof getAddonJsonLinkedData,
  clientApp: string,
  currentVersion: AddonVersionType | null,
  i18n: I18nType,
  lang: string,
|};

export class AddonHeadBase extends React.Component<InternalProps> {
  static defaultProps = {
    _getAddonJsonLinkedData: getAddonJsonLinkedData,
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

  render() {
    const { _getAddonJsonLinkedData, addon, currentVersion } = this.props;
    invariant(_getAddonJsonLinkedData, '_getAddonJsonLinkedData is required.');

    if (!addon) {
      return null;
    }

    const image = addon.themeData
      ? addon.themeData.previewURL
      : getPreviewImage(addon);

    return (
      <>
        <Helmet titleTemplate={null}>
          <title>{this.getPageTitle()}</title>

          <script type="application/ld+json">
            {JSON.stringify(_getAddonJsonLinkedData({ addon, currentVersion }))}
          </script>
        </Helmet>

        <HeadMetaTags
          appendDefaultTitle={false}
          date={addon.created}
          description={this.getPageDescription()}
          image={image}
          lastModified={addon.last_updated}
          title={this.getPageTitle()}
          withTwitterMeta={addon.type === ADDON_TYPE_EXTENSION}
        />

        <HeadLinks />
      </>
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { addon } = ownProps;
  const { clientApp, lang } = state.api;
  let currentVersion = null;
  if (addon && addon.currentVersionId) {
    currentVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  return {
    clientApp,
    currentVersion,
    lang,
  };
};

const AddonHead: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(AddonHeadBase);

export default AddonHead;
