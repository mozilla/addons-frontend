/* @flow */
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import {
  removeAddonFromCollection,
  deleteCollection,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  getCurrentCollection,
} from 'amo/reducers/collections';
import CollectionManager from 'amo/components/CollectionManager';
import NotFound from 'amo/components/ErrorPage/NotFound';
import AuthenticateButton from 'core/components/AuthenticateButton';
import {
  COLLECTIONS_EDIT, INSTALL_SOURCE_COLLECTION,
} from 'core/constants';
import Paginate from 'core/components/Paginate';
import { withFixedErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import { getCurrentUser, hasPermission } from 'amo/reducers/users';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import ConfirmButton from 'ui/components/ConfirmButton';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import type {
  CollectionsState,
  CollectionType,
} from 'amo/reducers/collections';
import type { UsersStateType } from 'amo/reducers/users';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';

import './styles.scss';


export type Props = {|
  _config: typeof config,
  collection: CollectionType | null,
  dispatch: DispatchFunc,
  editing: boolean,
  errorHandler: ErrorHandlerType,
  hasEditPermission: boolean,
  i18n: I18nType,
  isLoggedIn: boolean,
  loading: boolean,
  location: ReactRouterLocation,
  params: {|
    slug: string,
    username: string,
  |},
|};

export type RemoveCollectionAddonFunc = (addonId: number) => void;

export class CollectionBase extends React.Component<Props> {
  static defaultProps = {
    _config: config,
    editing: false,
  };

  componentWillMount() {
    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: Props) {
    this.loadDataIfNeeded(nextProps);
  }

  onDelete = (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { dispatch, errorHandler, collection } = this.props;

    invariant(collection, 'collection is required');

    const {
      slug,
      authorUsername: username,
    } = collection;

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(deleteCollection({
      errorHandlerId: errorHandler.id,
      slug,
      username,
    }));
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
      collection.authorUsername.toLowerCase() !== params.username.toLowerCase()
    )) {
      collectionChanged = true;
    }

    if (!collection || collectionChanged) {
      this.props.dispatch(fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        page: location.query.page,
        slug: params.slug,
        username: params.username,
      }));

      return;
    }

    if (collection && addonsPageChanged && collection.numberOfAddons) {
      this.props.dispatch(fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        page: location.query.page || 1,
        slug: params.slug,
        username: params.username,
      }));
    }
  }

  url() {
    const { params } = this.props;

    return `/collections/${params.username}/${params.slug}/`;
  }

  editUrl() {
    return `${this.url()}edit/`;
  }

  editCollectionLink() {
    const { _config, i18n, location } = this.props;
    const props = {};

    const pageQueryParam =
      location.query.page ? `?page=${location.query.page}` : '';
    const editUrl = `${this.editUrl()}${pageQueryParam}`;

    if (_config.get('enableNewCollectionsUI')) {
      // TODO: make this a real link when the form is ready for release.
      // https://github.com/mozilla/addons-frontend/issues/4293
      props.to = editUrl;
    } else {
      props.href = editUrl;
    }

    return (
      <Button
        className="Collection-edit-link"
        buttonType="neutral"
        puffy
        {...props}
      >
        {i18n.gettext('Edit this collection')}
      </Button>
    );
  }

  removeAddon: RemoveCollectionAddonFunc = (addonId: number) => {
    const {
      collection,
      dispatch,
      errorHandler,
      location: { query },
    } = this.props;

    invariant(collection, 'collection is required');

    const {
      slug,
      authorUsername: username,
    } = collection;

    invariant(query, 'query is required');
    invariant(slug, 'slug is required');
    invariant(username, 'page is required');

    dispatch(removeAddonFromCollection({
      addonId,
      errorHandlerId: errorHandler.id,
      page: query.page || 1,
      slug,
      username,
    }));
  };

  renderCardContents() {
    const {
      collection, editing, hasEditPermission, i18n, isLoggedIn, location,
    } = this.props;

    if (editing) {
      if (!isLoggedIn) {
        return (
          <AuthenticateButton
            noIcon
            location={location}
            logInText={i18n.gettext('Log in to edit this collection')}
          />
        );
      }
      return (
        <CollectionManager
          collection={collection}
          page={location.query.page}
        />
      );
    }

    /* eslint-disable react/no-danger */
    return (
      <React.Fragment>
        <h1 className="Collection-title">
          {collection ? collection.name : <LoadingText />}
        </h1>
        <p className="Collection-description">
          {collection ? (
            <span
              dangerouslySetInnerHTML={sanitizeHTML(collection.description)}
            />
          ) : <LoadingText />}
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
        {hasEditPermission ? this.editCollectionLink() : null}
      </React.Fragment>
    );
    /* eslint-enable react/no-danger */
  }

  renderDeleteButton() {
    const { hasEditPermission, i18n } = this.props;

    if (!hasEditPermission) {
      return null;
    }

    return (
      <ConfirmButton
        buttonType="cancel"
        className="Collection-delete-button"
        message={i18n.gettext('Do you really want to delete this collection?')}
        onConfirm={this.onDelete}
      >
        {i18n.gettext('Delete this collection')}
      </ConfirmButton>
    );
  }

  renderCollection() {
    const {
      collection,
      editing,
      loading,
      location,
      i18n,
    } = this.props;

    const addons: Array<CollectionAddonType> =
      (collection && collection.addons) || [];

    return (
      <div className="Collection-wrapper">
        <Card className="Collection-detail">
          {this.renderCardContents()}
          {this.renderDeleteButton()}
        </Card>
        <div className="Collection-items">
          <AddonsCard
            addonInstallSource={INSTALL_SOURCE_COLLECTION}
            addons={addons}
            editing={editing}
            loading={!collection || loading}
            removeAddon={this.removeAddon}
          />
          {!loading && addons && addons.length === 0 &&
            <p className="Collection-placeholder">{ i18n.gettext(
              'Search for extensions and themes to add to your collection.')}
            </p>
          }
          {collection && collection.numberOfAddons > 0 && (
            <Paginate
              LinkComponent={Link}
              count={collection.numberOfAddons}
              currentPage={location.query.page}
              pathname={editing ? this.editUrl() : this.url()}
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

  const currentUser = getCurrentUser(state.users);
  let hasEditPermission = false;

  const collection = getCurrentCollection(state.collections);

  return {
    collection,
    isLoggedIn: !!currentUser,
    loading,
    hasEditPermission,
  };
};

export const extractId = (ownProps: Props) => {
  return [
    ownProps.params.username,
    ownProps.params.slug,
    ownProps.location.query.page,
  ].join('/');
};

export default compose(
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionBase);
