/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import Page from 'amo/components/Page';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import {
  fetchAddon,
  fetchAddonInfo,
  getAddonByIdInURL,
  getAddonInfoBySlug,
  isAddonInfoLoading,
  isAddonLoading,
} from 'amo/reducers/addons';
import {
  fetchVersion,
  getLoadingBySlug,
  getVersionById,
} from 'amo/reducers/versions';
import { sanitizeUserHTML } from 'amo/utils';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { AddonInfoType } from 'amo/reducers/addons';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const ADDON_INFO_TYPE_CUSTOM_LICENSE: 'license' = 'license';
export const ADDON_INFO_TYPE_EULA: 'eula' = 'eula';
export const ADDON_INFO_TYPE_PRIVACY_POLICY: 'privacy' = 'privacy';

export type AddonInfoTypeType =
  | typeof ADDON_INFO_TYPE_CUSTOM_LICENSE
  | typeof ADDON_INFO_TYPE_EULA
  | typeof ADDON_INFO_TYPE_PRIVACY_POLICY;

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {
      slug: string,
    },
  |},

  infoType: AddonInfoTypeType,
|};

type PropsFromState = {|
  addon: AddonType | null,
  addonInfo: AddonInfoType | null,
  addonInfoIsLoading: boolean,
  addonIsLoading: boolean,
  addonVersion: AddonVersionType | null,
  addonVersionIsLoading: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class AddonInfoBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentDidUpdate(prevProps: InternalProps) {
    this.loadDataIfNeeded(prevProps);
  }

  loadDataIfNeeded(prevProps?: InternalProps) {
    const {
      addon,
      addonInfo,
      addonInfoIsLoading,
      addonIsLoading,
      addonVersion,
      addonVersionIsLoading,
      dispatch,
      errorHandler,
      infoType,
      match: {
        params: { slug },
      },
    } = this.props;

    const oldAddon = prevProps && prevProps.addon;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    // Fetch data when the add-on changes.
    const addonHasChanged = oldAddon && oldAddon.slug !== slug;

    if ((!addon || addonHasChanged) && !addonIsLoading) {
      dispatch(fetchAddon({ showGroupedRatings: true, slug, errorHandler }));
    }

    if (infoType === ADDON_INFO_TYPE_CUSTOM_LICENSE) {
      const needsLicenceText =
        addonVersion &&
        addonVersion.license &&
        addonVersion.license.text === undefined;
      if (
        addon &&
        addon.currentVersionId &&
        !addonVersionIsLoading &&
        (!addonVersion || needsLicenceText || addonHasChanged)
      ) {
        dispatch(
          fetchVersion({
            errorHandlerId: errorHandler.id,
            slug,
            versionId: addon.currentVersionId,
          }),
        );
      }
    } else if ((!addonInfo || addonHasChanged) && !addonInfoIsLoading) {
      dispatch(fetchAddonInfo({ slug, errorHandlerId: errorHandler.id }));
    }
  }

  render(): React.Node {
    const { addon, addonInfo, addonVersion, errorHandler, i18n, infoType } =
      this.props;

    let header = '';
    let infoContent;
    let infoHtml;
    let title;

    switch (infoType) {
      case ADDON_INFO_TYPE_CUSTOM_LICENSE:
        title = i18n.t('Custom License');
        if (addonVersion && addonVersion.license) {
          // If license.text is null, as opposed to undefined, it means we have
          // already retrieved the licence, but that it's null on the server.
          if (addonVersion.license.text === null) {
            infoContent = '';
          } else infoContent = addonVersion.license.text;
        } else {
          infoContent = null;
        }
        break;
      case ADDON_INFO_TYPE_EULA:
        title = i18n.t('End-User License Agreement');
        infoContent = addonInfo ? addonInfo.eula : null;
        break;
      case ADDON_INFO_TYPE_PRIVACY_POLICY:
        title = i18n.t('Privacy policy');
        infoContent = addonInfo ? addonInfo.privacyPolicy : null;
        break;
      default:
        title = '';
    }

    if (addon) {
      header = i18n.t('%(title)s for %(addonName)s', {
        title,
        addonName: addon.name,
      });
    }

    if (
      infoContent ||
      (infoType === ADDON_INFO_TYPE_CUSTOM_LICENSE && infoContent)
    ) {
      infoHtml = sanitizeUserHTML(infoContent);
    }

    return (
      <Page errorHandler={errorHandler}>
        <div className={makeClassName('AddonInfo', `AddonInfo--${infoType}`)}>
          {addon && (
            <Helmet>
              <title>{header}</title>
              <meta name="robots" content="noindex, follow" />
            </Helmet>
          )}

          {errorHandler.renderErrorIfPresent()}

          <AddonSummaryCard addon={addon} headerText={header} />

          <Card className="AddonInfo-info" header={header}>
            {infoHtml ? (
              <p
                className="AddonInfo-info-html"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={infoHtml}
              />
            ) : (
              <LoadingText />
            )}
          </Card>
        </div>
      </Page>
    );
  }
}

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { slug } = ownProps.match.params;
  const addon = getAddonByIdInURL(state.addons, slug);

  let addonVersion = null;

  if (addon && addon.currentVersionId) {
    addonVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  return {
    addon,
    addonIsLoading: isAddonLoading(state, slug),
    addonInfo: getAddonInfoBySlug({ slug, state: state.addons }),
    addonInfoIsLoading: isAddonInfoLoading({ slug, state: state.addons }),
    addonVersion,
    addonVersionIsLoading: getLoadingBySlug({ slug, state: state.versions }),
  };
}

export const extractId = (ownProps: Props): string => {
  const {
    infoType,
    match: {
      params: { slug },
    },
  } = ownProps;

  return `${slug}-${infoType}`;
};

const AddonInfo: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonInfoBase);

export default AddonInfo;
