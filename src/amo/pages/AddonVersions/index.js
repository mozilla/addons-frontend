/* @flow */
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import AddonVersionCard from 'amo/components/AddonVersionCard';
import Page from 'amo/components/Page';
import {
  fetchVersions,
  getLoadingBySlug,
  getVersionsBySlug,
} from 'amo/reducers/versions';
import {
  fetchAddon,
  getAddonByIdInURL,
  isAddonLoading,
} from 'amo/reducers/addons';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import CardList from 'amo/components/CardList';
import LoadingText from 'amo/components/LoadingText';
import Notice from 'amo/components/Notice';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  // The `location` prop is used in `extractId()`.
  // eslint-disable-next-line react/no-unused-prop-types
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {|
      slug: string,
    |},
  |},
|};

type PropsFromState = {|
  addon: AddonType | null,
  addonIsLoading: boolean,
  areVersionsLoading: boolean,
  versions: Array<AddonVersionType> | null | void,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
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
      dispatch(fetchAddon({ showGroupedRatings: true, slug, errorHandler }));
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

  render(): React.Node {
    const { addon, errorHandler, i18n, versions } = this.props;

    let latestVersion;
    let olderVersions: Array<AddonVersionType> = [];
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
          '%(addonName)s version history - %(total)s version',
          '%(addonName)s version history - %(total)s versions',
          versions.length,
        ),
        {
          addonName: addon.name,
          total: i18n.formatNumber(versions.length),
        },
      );
    }

    return (
      <Page errorHandler={errorHandler} isAddonInstallPage>
        <div className="AddonVersions">
          {addon && (
            <Helmet>
              <title>{header}</title>
            </Helmet>
          )}

          {errorHandler.renderErrorIfPresent()}

          <div className="AddonVersions-wrapper">
            <AddonSummaryCard addon={addon} headerText={header} />

            <CardList
              className="AddonVersions-versions"
              header={header || <LoadingText />}
            >
              <ul>
                <li>
                  <Notice type="warning">
                    <span className="AddonVersions-warning-text">
                      {i18n.gettext(
                        'Be careful with old versions! These versions are displayed for testing and reference purposes.',
                      )}
                    </span>
                    <span className="AddonVersions-warning-text">
                      {i18n.gettext(
                        'You should always use the latest version of an add-on.',
                      )}
                    </span>
                  </Notice>
                </li>

                <AddonVersionCard
                  addon={addon}
                  headerText={i18n.gettext('Latest version')}
                  isCurrentVersion
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

export const extractId = (ownProps: Props): string => {
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
