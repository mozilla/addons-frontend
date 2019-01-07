/* @flow */
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import AddonVersionCard from 'amo/components/AddonVersionCard';
import {
  fetchVersions,
  getLoadingBySlug,
  getVersionsBySlug,
} from 'core/reducers/versions';
import {
  fetchAddon,
  getAddonBySlug,
  isAddonLoading,
} from 'core/reducers/addons';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';
import type { AddonVersionType } from 'core/reducers/versions';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
|};

type InternalProps = {|
  ...Props,
  addon: AddonType | null,
  addonIsLoading: boolean,
  areVersionsLoading: boolean,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  match: {|
    ...ReactRouterMatchType,
    params: {|
      slug: string,
    |},
  |},
  versions: Array<AddonVersionType> | void,
|};

export class AddonVersionsBase extends React.Component<InternalProps> {
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
      addonIsLoading,
      areVersionsLoading,
      dispatch,
      errorHandler,
      versions,
      match: {
        params: { slug },
      },
    } = this.props;

    const oldAddon = prevProps && prevProps.addon;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    // Fetch versions when the add-on changes.
    const addonHasChanged = oldAddon && oldAddon.slug !== slug;

    if ((!addon || addonHasChanged) && !addonIsLoading) {
      dispatch(fetchAddon({ slug, errorHandler }));
    }

    if (!areVersionsLoading && (!versions || addonHasChanged)) {
      dispatch(
        fetchVersions({
          errorHandlerId: errorHandler.id,
          slug,
        }),
      );
    }
  }

  render() {
    const { addon, errorHandler, i18n, versions } = this.props;

    let latestVersion;
    let olderVersions = [];
    if (addon && versions) {
      latestVersion =
        versions.find((version) => version.id === addon.currentVersionId) ||
        null;
      olderVersions = versions.filter(
        (version) => version.id !== addon.currentVersionId,
      );
    }

    let header = '';
    if (addon && versions) {
      header = i18n.sprintf(
        i18n.ngettext(
          '%(addonName)s Version history - %(total)s version',
          '%(addonName)s Version history - %(total)s versions',
          versions.length,
        ),
        {
          addonName: addon.name,
          total: i18n.formatNumber(versions.length),
        },
      );
    }

    return (
      <div className="AddonVersions">
        {addon && (
          <Helmet>
            <title>{header}</title>
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        <AddonSummaryCard addon={addon} headerText={header} />

        <CardList
          className="AddonVersions-versions"
          header={header || <LoadingText />}
        >
          <ul>
            <AddonVersionCard
              addon={addon}
              headerText={i18n.gettext('Latest version')}
              key="latestVersion"
              version={latestVersion}
            />
            {olderVersions.map((version, index) => {
              return (
                <AddonVersionCard
                  addon={addon}
                  headerText={
                    index === 0 ? i18n.gettext('Older versions') : null
                  }
                  key={version.id}
                  version={version}
                />
              );
            })}
          </ul>
        </CardList>
      </div>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { slug } = ownProps.match.params;
  const addon = getAddonBySlug(state, slug);
  const areVersionsLoading = getLoadingBySlug({ slug, state: state.versions });

  return {
    addon,
    addonIsLoading: isAddonLoading(state, slug),
    areVersionsLoading,
    versions:
      !addon || areVersionsLoading
        ? undefined
        : getVersionsBySlug({ slug, state: state.versions }),
  };
}

export const extractId = (ownProps: InternalProps) => {
  const {
    location,
    match: { params },
  } = ownProps;

  return `${params.slug}-${location.query.page || ''}`;
};

const AddonVersions: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonVersionsBase);

export default AddonVersions;
