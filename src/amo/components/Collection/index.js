/* @flow */
import React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { fetchCollection, fetchCollectionPage } from 'amo/reducers/collections';
import Paginate from 'core/components/Paginate';
import { withErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
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
import type { ReactRouterLocation } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  collection: CollectionType | null,
  dispatch: Function,
  errorHandler: ErrorHandlerType,
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
    let location = this.props.location;

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
      collection.authorUsername !== params.user
    )) {
      collectionChanged = true;
    }

    if (!collection || collectionChanged) {
      this.props.dispatch(fetchCollection({
        errorHandlerId: errorHandler.id,
        page: parsePage(location.query.page),
        slug: params.slug,
        user: params.user,
      }));

      return;
    }

    if (collection && addonsPageChanged) {
      this.props.dispatch(fetchCollectionPage({
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
    const { collection, i18n, loading, location } = this.props;

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
        </Card>
        <div className="Collection-items">
          <AddonsCard
            addons={addons}
            loading={!collection || loading}
          />
          {collection && (
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
      // 401 and 403 are for an add-on lookup is made to look like a 404 on
      // purpose. See: https://github.com/mozilla/addons-frontend/issues/3061.
      if (errorHandler.capturedError.responseStatusCode === 401 ||
        errorHandler.capturedError.responseStatusCode === 403 ||
        errorHandler.capturedError.responseStatusCode === 404
      ) {
        return <NotFound />;
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

export const mapStateToProps = (state: { collections: CollectionsState }) => {
  return {
    collection: state.collections.current,
    loading: state.collections.loading,
  };
};

export default compose(
  translate(),
  withErrorHandler({
    // This allows to sync the client and the server error handler ids, thus
    // allowing the client side to be aware of errors thrown on the server.
    // See: https://github.com/mozilla/addons-frontend/issues/3313
    id: 'Collection-001',
    name: 'Collection',
  }),
  connect(mapStateToProps),
)(CollectionBase);
