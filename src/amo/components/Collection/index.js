/* @flow */
import React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import {
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  getCurrentCollection,
} from 'amo/reducers/collections';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { COLLECTIONS_EDIT } from 'core/constants';
import Paginate from 'core/components/Paginate';
import { withFixedErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import { hasPermission } from 'amo/reducers/users';
import translate from 'core/i18n/translate';
import { parsePage } from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import type {
  CollectionsState,
  CollectionType,
} from 'amo/reducers/collections';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { UsersStateType } from 'amo/reducers/users';
import type { ReactRouterLocation } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  collection: CollectionType | null,
  dispatch: Function,
  errorHandler: ErrorHandlerType,
  hasEditPermission: boolean,
  i18n: I18nType,
  loading: boolean,
  location: ReactRouterLocation,
  params: {|
    slug: string,
    user: string,
  |},
|};

export class CollectionBase extends React.Component<Props> {
  componentWillMount() {
    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: Props) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps?: Props) {
    const { collection, errorHandler, loading, params } = {
      ...this.props,
      ...nextProps,
    };

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (loading) {
      return;
    }

    let collectionChanged = false;
    let addonsPageChanged = false;
    let { location } = this.props;

    if (nextProps && nextProps.location) {
      const nextLocation = nextProps.location;

      if (location.pathname !== nextLocation.pathname) {
        collectionChanged = true;
        location = nextLocation;
      }

      if (location.query.page !== nextLocation.query.page) {
        addonsPageChanged = true;
        location = nextLocation;
      }
    }

    if (collection && (
      collection.slug !== params.slug ||
      collection.authorUsername.toLowerCase() !== params.user.toLowerCase()
    )) {
      collectionChanged = true;
    }

    if (!collection || collectionChanged) {
      this.props.dispatch(fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        page: parsePage(location.query.page),
        slug: params.slug,
        user: params.user,
      }));

      return;
    }

    if (collection && addonsPageChanged) {
      this.props.dispatch(fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        page: parsePage(location.query.page),
        slug: params.slug,
        user: params.user,
      }));
    }
  }

  url() {
    const { params } = this.props;

    return `/collections/${params.user}/${params.slug}/`;
  }

  renderCollection() {
    const {
      collection,
      hasEditPermission,
      i18n,
      loading,
      location,
    } = this.props;

    const addons = collection ? collection.addons : [];

    return (
      <div className="Collection-wrapper">
        <Card className="Collection-detail">
          <h1 className="Collection-title">
            {collection ? collection.name : <LoadingText />}
          </h1>
          <p className="Collection-description">
            {collection ? collection.description : <LoadingText />}
          </p>
          <MetadataCard
            metadata={[
              {
                content: collection ? collection.numberOfAddons : null,
                title: i18n.gettext('Add-ons'),
              },
              {
                content: collection ? collection.authorName : null,
                title: i18n.gettext('Creator'),
              },
              {
                content: collection ?
                  i18n.moment(collection.lastUpdatedDate).format('ll') :
                  null,
                title: i18n.gettext('Last updated'),
              },
            ]}
          />
          {hasEditPermission && (
            <p className="Collection-edit-link">
              <Link href={`${this.url()}/edit/`}>
                {i18n.gettext('Edit this collection')}
              </Link>
            </p>
          )}
        </Card>
        <div className="Collection-items">
          <AddonsCard
            addons={addons}
            loading={!collection || loading}
          />
          {collection && collection.numberOfAddons > 0 && (
            <Paginate
              LinkComponent={Link}
              count={collection.numberOfAddons}
              currentPage={parsePage(location.query.page)}
              pathname={this.url()}
            />
          )}
        </div>
      </div>
    );
  }

  render() {
    const { collection, errorHandler } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFound errorCode={errorHandler.capturedError.code} />;
      }
    }

    return (
      <div className="Collection">
        {collection && (
          <Helmet>
            <title>{collection.name}</title>
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        {this.renderCollection()}
      </div>
    );
  }
}

export const mapStateToProps = (
  state: {| collections: CollectionsState, users: UsersStateType |}
) => {
  const { loading } = state.collections.current;

  let hasEditPermission = false;

  const collection = getCurrentCollection(state.collections);
  if (collection) {
    hasEditPermission = collection.authorId === state.users.currentUserID ||
      hasPermission(state, COLLECTIONS_EDIT);
  }

  return {
    collection,
    loading,
    hasEditPermission,
  };
};

export const extractId = (ownProps: Props) => {
  return [
    ownProps.params.user,
    ownProps.params.slug,
    parsePage(ownProps.location.query.page),
  ].join('/');
};

export default compose(
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionBase);
