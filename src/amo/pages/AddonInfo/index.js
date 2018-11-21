/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import {
  fetchAddon,
  fetchAddonInfo,
  getAddonBySlug,
  getAddonInfoBySlug,
  isAddonInfoLoading,
  isAddonLoading,
} from 'core/reducers/addons';
import { nl2br, sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonInfoType } from 'core/reducers/addons';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const ADDON_INFO_TYPE_EULA: 'eula' = 'eula';
export const ADDON_INFO_TYPE_PRIVACY_POLICY: 'privacy' = 'privacy';

export type AddonInfoTypeType =
  | typeof ADDON_INFO_TYPE_EULA
  | typeof ADDON_INFO_TYPE_PRIVACY_POLICY;

type Props = {|
  location: ReactRouterLocationType,
|};

type InternalProps = {|
  ...Props,
  addon: AddonType | null,
  addonInfo: AddonInfoType | null,
  addonInfoIsLoading: boolean,
  addonIsLoading: boolean,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  infoType: AddonInfoTypeType,
  match: {|
    ...ReactRouterMatchType,
    params: {
      slug: string,
    },
  |},
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
      dispatch,
      errorHandler,
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
      dispatch(fetchAddon({ slug, errorHandler }));
    }

    if ((!addonInfo || addonHasChanged) && !addonInfoIsLoading) {
      dispatch(fetchAddonInfo({ slug, errorHandlerId: errorHandler.id }));
    }
  }

  render() {
    const { addon, addonInfo, errorHandler, i18n, infoType } = this.props;

    let infoHtml;
    let header = '';
    if (addon) {
      const title =
        infoType === ADDON_INFO_TYPE_EULA
          ? i18n.gettext('End-User License Agreement for %(addonName)s')
          : i18n.gettext('Privacy policy for %(addonName)s');
      header = i18n.sprintf(title, { addonName: addon.name });
    }

    if (addonInfo) {
      const infoContent =
        infoType === ADDON_INFO_TYPE_EULA
          ? addonInfo.eula
          : addonInfo.privacyPolicy;
      infoHtml = sanitizeHTML(nl2br(infoContent), [
        'a',
        'abbr',
        'acronym',
        'b',
        'blockquote',
        'br',
        'code',
        'em',
        'i',
        'li',
        'ol',
        'strong',
        'ul',
      ]);
    }

    return (
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
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { slug } = ownProps.match.params;

  return {
    addon: getAddonBySlug(state, slug),
    addonIsLoading: isAddonLoading(state, slug),
    addonInfo: getAddonInfoBySlug({ slug, state: state.addons }),
    addonInfoIsLoading: isAddonInfoLoading({ slug, state: state.addons }),
  };
}

export const extractId = (ownProps: InternalProps) => {
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
