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
} from 'core/reducers/versions';
import {
  fetchAddon,
  getAddonByIdInURL,
  isAddonLoading,
} from 'core/reducers/addons';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';
import Notice from 'ui/components/Notice';
import type { AddonVersionType } from 'core/reducers/versions';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/types/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

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

type InternalProps = {|
  ...Props,
  addon: AddonType | null,
  addonIsLoading: boolean,
  areVersionsLoading: boolean,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
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
      <Page errorHandler={errorHandler}>
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
                    <p className="AddonVersions-warning-text">
                      {i18n.gettext(
                        'Be careful with old versions! These versions are displayed for testing and reference purposes.',
                      )}
                    </p>
                    <p className="AddonVersions-warning-text">
                      {i18n.gettext(
                        'You should always use the latest version of an add-on.',
                      )}
                    </p>
                  </Notice>
                </li>

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
        </div>
      </Page>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
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

export const extractId = (ownProps: Props) => {
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
