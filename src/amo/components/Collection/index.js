/* @flow */
import config from 'config';
import deepEqual from 'deep-eql';
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import CollectionControls from 'amo/components/CollectionControls';
import CollectionDetails from 'amo/components/CollectionDetails';
import CollectionManager from 'amo/components/CollectionManager';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import { isFeaturedCollection } from 'amo/components/Home';
import {
  collectionEditUrl,
  collectionUrl,
  convertFiltersToQueryParams,
  deleteCollectionAddonNotes,
  deleteCollection,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  getCurrentCollection,
  removeAddonFromCollection,
  updateCollectionAddon,
} from 'amo/reducers/collections';
import { getCurrentUser, hasPermission } from 'amo/reducers/users';
import AuthenticateButton from 'core/components/AuthenticateButton';
import Paginate from 'core/components/Paginate';
import {
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  FEATURED_THEMES_COLLECTION_EDIT,
  FEATURED_THEMES_COLLECTION_SLUG,
  INSTALL_SOURCE_COLLECTION,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  MOZILLA_COLLECTIONS_EDIT,
  MOZILLA_COLLECTIONS_USERNAME,
} from 'core/constants';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Card from 'ui/components/Card';
import ConfirmButton from 'ui/components/ConfirmButton';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';

import './styles.scss';

export const DEFAULT_ADDON_PLACEHOLDER_COUNT = 3;

export type Props = {|
  collection: CollectionType | null,
  creating: boolean,
  editing: boolean,
  loading: boolean,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _isFeaturedCollection: typeof isFeaturedCollection,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  filters: CollectionFilters,
  hasEditPermission: boolean,
  i18n: I18nType,
  isLoggedIn: boolean,
  isOwner: boolean,
  lang: string,
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {|
      slug: string,
      username: string,
    |},
  |},
  showEditButton: boolean,
|};

export type RemoveCollectionAddonFunc = (addonId: number) => void;
export type DeleteAddonNoteFunc = (
  addonId: number,
  errorHandler: ErrorHandlerType,
) => void;
export type SaveAddonNoteFunc = (
  addonId: number,
  errorHandler: ErrorHandlerType,
  notes: string,
) => void;

export class CollectionBase extends React.Component<InternalProps> {
  addonPlaceholderCount: number;

  static defaultProps = {
    _config: config,
    _isFeaturedCollection: isFeaturedCollection,
    creating: false,
    editing: false,
  };

  constructor(props: InternalProps) {
    super(props);
    this.addonPlaceholderCount = DEFAULT_ADDON_PLACEHOLDER_COUNT;
    this.maybeResetAddonPlaceholderCount();
  }

  maybeResetAddonPlaceholderCount() {
    const { collection } = this.props;
    if (collection && collection.addons && collection.addons.length) {
      // Store the previous count of collection add-ons for use as
      // the placeholder count when loading the next set of add-ons.
      this.addonPlaceholderCount = collection.addons.length;
    }
  }

  componentWillMount() {
    this.loadDataIfNeeded();
  }

  componentDidUpdate() {
    this.maybeResetAddonPlaceholderCount();
  }

  componentWillReceiveProps(nextProps: InternalProps) {
    this.loadDataIfNeeded(nextProps);
  }

  onDelete = (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { collection, dispatch, errorHandler } = this.props;

    invariant(collection, 'collection is required');

    const { authorUsername: username, slug } = collection;

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(
      deleteCollection({
        errorHandlerId: errorHandler.id,
        slug,
        username,
      }),
    );
  };

  loadDataIfNeeded(nextProps?: InternalProps) {
    const {
      collection,
      creating,
      errorHandler,
      loading,
      match: { params },
    } = {
      ...this.props,
      ...nextProps,
    };

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (creating || loading) {
      return;
    }

    let collectionChanged = false;
    let addonsPageChanged = false;
    let { filters, location } = this.props;

    if (nextProps && nextProps.location) {
      const nextLocation = nextProps.location;

      if (location.pathname !== nextLocation.pathname) {
        collectionChanged = true;
        location = nextLocation;
      }
    }

    if (nextProps && nextProps.filters) {
      const nextFilters = nextProps.filters;

      if (!deepEqual(filters, nextFilters)) {
        addonsPageChanged = true;
        filters = nextFilters;
      }
    }

    if (
      collection &&
      (collection.slug !== params.slug ||
        collection.authorUsername.toLowerCase() !==
          params.username.toLowerCase())
    ) {
      collectionChanged = true;
    }

    if (!collection || collectionChanged) {
      this.props.dispatch(
        fetchCurrentCollection({
          errorHandlerId: errorHandler.id,
          filters,
          slug: params.slug,
          username: params.username,
        }),
      );

      return;
    }

    if (collection && addonsPageChanged && collection.numberOfAddons) {
      this.props.dispatch(
        fetchCurrentCollectionPage({
          errorHandlerId: errorHandler.id,
          filters,
          slug: params.slug,
          username: params.username,
        }),
      );
    }
  }

  removeAddon: RemoveCollectionAddonFunc = (addonId: number) => {
    const { collection, dispatch, errorHandler, filters } = this.props;

    invariant(collection, 'collection is required');

    const { authorUsername: username, slug } = collection;

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(
      removeAddonFromCollection({
        addonId,
        errorHandlerId: errorHandler.id,
        filters,
        slug,
        username,
      }),
    );
  };

  deleteNote: DeleteAddonNoteFunc = (
    addonId: number,
    errorHandler: ErrorHandlerType,
  ) => {
    const { collection, dispatch, filters } = this.props;

    invariant(collection, 'collection is required');

    const { authorUsername: username, slug } = collection;

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(
      deleteCollectionAddonNotes({
        addonId,
        errorHandlerId: errorHandler.id,
        filters,
        slug,
        username,
      }),
    );
  };

  saveNote: SaveAddonNoteFunc = (
    addonId: number,
    errorHandler: ErrorHandlerType,
    notes: string,
  ) => {
    const { collection, dispatch, filters } = this.props;

    invariant(collection, 'collection is required');

    const { authorUsername: username, slug } = collection;

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(
      updateCollectionAddon({
        addonId,
        errorHandlerId: errorHandler.id,
        notes,
        filters,
        slug,
        username,
      }),
    );
  };

  renderCardContents() {
    const {
      collection,
      creating,
      editing,
      filters,
      showEditButton,
    } = this.props;

    if (creating || editing) {
      return (
        <CollectionManager
          collection={collection}
          creating={creating}
          filters={filters}
        />
      );
    }

    return (
      <CollectionDetails
        collection={collection}
        filters={filters}
        showEditButton={showEditButton}
      />
    );
  }

  renderDeleteButton() {
    const { i18n, isOwner } = this.props;

    if (!isOwner) {
      return null;
    }

    const confirmButtonClassName = 'Collection-delete-button';

    return (
      <ConfirmButton
        buttonType="cancel"
        className={confirmButtonClassName}
        id={confirmButtonClassName}
        message={i18n.gettext('Do you really want to delete this collection?')}
        onConfirm={this.onDelete}
      >
        {i18n.gettext('Delete this collection')}
      </ConfirmButton>
    );
  }

  renderCollection() {
    const {
      _isFeaturedCollection,
      collection,
      creating,
      editing,
      filters,
      i18n,
      isLoggedIn,
      loading,
      location,
    } = this.props;

    if ((creating || editing) && !isLoggedIn) {
      const logInText = creating
        ? i18n.gettext('Log in to create a collection')
        : i18n.gettext('Log in to edit this collection');

      return (
        <Card className="Collection-login">
          <AuthenticateButton
            noIcon
            location={location}
            logInText={logInText}
          />
        </Card>
      );
    }

    const addons: Array<CollectionAddonType> =
      (collection && collection.addons) || [];

    const paginator =
      collection &&
      collection.pageSize &&
      collection.numberOfAddons > collection.pageSize ? (
        <Paginate
          LinkComponent={Link}
          count={collection.numberOfAddons}
          currentPage={filters.page}
          pathname={
            editing
              ? collectionEditUrl({ collection })
              : collectionUrl({ collection })
          }
          perPage={collection.pageSize}
          queryParams={convertFiltersToQueryParams(filters)}
        />
      ) : null;

    let placeholderText;
    if (isLoggedIn && (creating || (!loading && addons.length === 0))) {
      placeholderText = creating
        ? i18n.gettext(
            'First, create your collection. Then you can add extensions and themes.',
          )
        : i18n.gettext(
            'Search for extensions and themes to add to your collection.',
          );
    }

    const addonInstallSource =
      collection && _isFeaturedCollection(collection)
        ? INSTALL_SOURCE_FEATURED_COLLECTION
        : INSTALL_SOURCE_COLLECTION;

    return (
      <div className="Collection-wrapper">
        <div className="Collection-detail-wrapper">
          <Card className="Collection-detail">
            {this.renderCardContents()}
            {this.renderDeleteButton()}
          </Card>
          <CollectionControls
            collection={collection}
            editing={editing}
            filters={filters}
          />
        </div>
        <div className="Collection-items">
          {!creating && (
            <AddonsCard
              addonInstallSource={addonInstallSource}
              addons={addons}
              deleteNote={this.deleteNote}
              editing={editing}
              footer={paginator}
              loading={!collection || loading}
              placeholderCount={this.addonPlaceholderCount}
              removeAddon={this.removeAddon}
              saveNote={this.saveNote}
            />
          )}
          {placeholderText && (
            <p className="Collection-placeholder">{placeholderText}</p>
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

export const mapStateToProps = (state: AppState, ownProps: InternalProps) => {
  const { loading } = state.collections.current;
  const { creating, location } = ownProps;

  const filters = {
    page: location.query.page || 1,
    collectionSort:
      location.query.collection_sort || COLLECTION_SORT_DATE_ADDED_DESCENDING,
  };

  const currentUser = getCurrentUser(state.users);
  const collection = creating ? null : getCurrentCollection(state.collections);

  const isOwner =
    collection && currentUser && collection.authorId === currentUser.id;
  let hasEditPermission = false;
  let showEditButton = false;

  if (collection && currentUser) {
    hasEditPermission =
      isOwner ||
      // User can edit mozilla collections, and it is a mozilla collection.
      (collection.authorUsername === MOZILLA_COLLECTIONS_USERNAME &&
        hasPermission(state, MOZILLA_COLLECTIONS_EDIT));
    showEditButton =
      hasEditPermission ||
      // User can maintain the featured themes collection, and it is the featured
      // themes collection.
      (collection.authorUsername === MOZILLA_COLLECTIONS_USERNAME &&
        collection.slug === FEATURED_THEMES_COLLECTION_SLUG &&
        hasPermission(state, FEATURED_THEMES_COLLECTION_EDIT));
  }

  return {
    collection,
    filters,
    hasEditPermission,
    isLoggedIn: !!currentUser,
    isOwner,
    loading,
    showEditButton,
  };
};

export const extractId = (ownProps: InternalProps) => {
  return [
    ownProps.match.params.username,
    ownProps.match.params.slug,
    ownProps.location.query.page,
  ].join('/');
};

const Collection: React.ComponentType<Props> = compose(
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionBase);

export default Collection;
