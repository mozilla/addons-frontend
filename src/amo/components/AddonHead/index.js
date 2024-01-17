/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import serialize from 'serialize-javascript';

import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { getPreviewImage } from 'amo/imageUtils';
import { getVersionById, getVersionInfo } from 'amo/reducers/versions';
import { getAddonJsonLinkedData } from 'amo/utils/addons';
import type { AppState } from 'amo/store';
import type { AddonVersionType, VersionInfoType } from 'amo/reducers/versions';
import type { I18nType } from 'amo/types/i18n';
import type { AddonType } from 'amo/types/addons';

type Props = {|
  addon: AddonType | null,
|};

type DefaultProps = {|
  _getAddonJsonLinkedData: typeof getAddonJsonLinkedData,
|};

type PropsFromState = {|
  clientApp: string,
  currentVersion: AddonVersionType | null,
  lang: string,
  versionInfo: VersionInfoType | null,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

export class AddonHeadBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _getAddonJsonLinkedData: getAddonJsonLinkedData,
  };

  getPageTitle(): string {
    const { addon, clientApp, i18n, lang } = this.props;

    invariant(addon, 'addon is required');

    const i18nValues = {
      addonName: addon.name,
      locale: lang,
    };

    if (clientApp === CLIENT_APP_ANDROID) {
      switch (addon.type) {
        case ADDON_TYPE_DICT:
          return i18n.sprintf(
            // L10n: please keep the fox emoji next to "Firefox Android".
            i18n.gettext(
              '%(addonName)s – Get this Dictionary for 🦊 Firefox Android (%(locale)s)',
            ),
            i18nValues,
          );
        case ADDON_TYPE_EXTENSION:
          return i18n.sprintf(
            // L10n: please keep the fox emoji next to "Firefox Android".
            i18n.gettext(
              '%(addonName)s – Get this Extension for 🦊 Firefox Android (%(locale)s)',
            ),
            i18nValues,
          );
        case ADDON_TYPE_LANG:
          return i18n.sprintf(
            // L10n: please keep the fox emoji next to "Firefox Android".
            i18n.gettext(
              '%(addonName)s – Get this Language Pack for 🦊 Firefox Android (%(locale)s)',
            ),
            i18nValues,
          );
        case ADDON_TYPE_STATIC_THEME:
          return i18n.sprintf(
            // L10n: please keep the fox emoji next to "Firefox Android".
            i18n.gettext(
              '%(addonName)s – Get this Theme for 🦊 Firefox Android (%(locale)s)',
            ),
            i18nValues,
          );
        default:
          return i18n.sprintf(
            // L10n: please keep the fox emoji next to "Firefox Android".
            i18n.gettext(
              '%(addonName)s – Get this Add-on for 🦊 Firefox Android (%(locale)s)',
            ),
            i18nValues,
          );
      }
    }

    switch (addon.type) {
      case ADDON_TYPE_DICT:
        return i18n.sprintf(
          // L10n: please keep the fox emoji next to "Firefox".
          i18n.gettext(
            '%(addonName)s – Get this Dictionary for 🦊 Firefox (%(locale)s)',
          ),
          i18nValues,
        );
      case ADDON_TYPE_EXTENSION:
        return i18n.sprintf(
          // L10n: please keep the fox emoji next to "Firefox".
          i18n.gettext(
            '%(addonName)s – Get this Extension for 🦊 Firefox (%(locale)s)',
          ),
          i18nValues,
        );
      case ADDON_TYPE_LANG:
        return i18n.sprintf(
          // L10n: please keep the fox emoji next to "Firefox".
          i18n.gettext(
            '%(addonName)s – Get this Language Pack for 🦊 Firefox (%(locale)s)',
          ),
          i18nValues,
        );
      case ADDON_TYPE_STATIC_THEME:
        return i18n.sprintf(
          // L10n: please keep the fox emoji next to "Firefox".
          i18n.gettext(
            '%(addonName)s – Get this Theme for 🦊 Firefox (%(locale)s)',
          ),
          i18nValues,
        );
      default:
        return i18n.sprintf(
          // L10n: please keep the fox emoji next to "Firefox".
          i18n.gettext(
            '%(addonName)s – Get this Add-on for 🦊 Firefox (%(locale)s)',
          ),
          i18nValues,
        );
    }
  }

  getPageDescription(): string {
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

  render(): null | React.Node {
    const { _getAddonJsonLinkedData, addon, currentVersion, versionInfo } =
      this.props;
    invariant(_getAddonJsonLinkedData, '_getAddonJsonLinkedData is required.');

    if (!addon) {
      return null;
    }

    const lastUpdated = versionInfo && versionInfo.created;

    return (
      <>
        <Helmet titleTemplate={null}>
          <title>{this.getPageTitle()}</title>

          <script type="application/ld+json">
            {serialize(_getAddonJsonLinkedData({ addon, currentVersion }), {
              isJSON: true,
            })}
          </script>
        </Helmet>

        <HeadMetaTags
          appendDefaultTitle={false}
          date={addon.created}
          description={this.getPageDescription()}
          image={getPreviewImage(addon)}
          lastModified={lastUpdated}
          title={this.getPageTitle()}
          withTwitterMeta={addon.type === ADDON_TYPE_EXTENSION}
        />

        <HeadLinks />
      </>
    );
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: InternalProps,
): PropsFromState => {
  const { addon, i18n } = ownProps;
  const { clientApp, lang } = state.api;
  let currentVersion = null;
  let versionInfo = null;

  if (addon && addon.currentVersionId) {
    currentVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  if (currentVersion) {
    versionInfo = getVersionInfo({
      i18n,
      state: state.versions,
      versionId: currentVersion.id,
    });
  }

  return {
    clientApp,
    currentVersion,
    lang,
    versionInfo,
  };
};

const AddonHead: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(AddonHeadBase);

export default AddonHead;
