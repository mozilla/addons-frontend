/* @flow */
import config from 'config';
import deepEqual from 'deep-eql';
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import CollectionManager from 'amo/components/CollectionManager';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import {
  deleteCollectionAddonNotes,
  removeAddonFromCollection,
  deleteCollection,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  getCurrentCollection,
  updateCollectionAddon,
} from 'amo/reducers/collections';
import { getCurrentUser, hasPermission } from 'amo/reducers/users';
import AuthenticateButton from 'core/components/AuthenticateButton';
import Paginate from 'core/components/Paginate';
import {
  COLLECTION_SORT_DATE_ADDED_ASCENDING,
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  COLLECTION_SORT_NAME,
  COLLECTION_SORT_POPULARITY,
  FEATURED_THEMES_COLLECTION_EDIT,
  FEATURED_THEMES_COLLECTION_SLUG,
  INSTALL_SOURCE_COLLECTION,
  MOZILLA_COLLECTIONS_EDIT,
  MOZILLA_COLLECTIONS_USERNAME,
} from 'core/constants';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
} from 'core/searchUtils';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import ConfirmButton from 'ui/components/ConfirmButton';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import Select from 'ui/components/Select';
import type {
  CollectionFilters,
  CollectionsState,
  CollectionType,
} from 'amo/reducers/collections';
import type { UsersStateType } from 'amo/reducers/users';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { ApiStateType } from 'core/reducers/api';
import type { CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation, ReactRouterType } from 'core/types/router';

import './styles.scss';

export type Props = {|
  collection: CollectionType | null,
  creating: boolean,
  editing: boolean,
  loading: boolean,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  filters: CollectionFilters,
  hasEditPermission: boolean,
  i18n: I18nType,
  isLoggedIn: boolean,
  isOwner: boolean,
  lang: string,
  location: ReactRouterLocation,
  params: {|
    slug: string,
    username: string,
  |},
  router: ReactRouterType,
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
  static defaultProps = {
    _config: config,
    creating: false,
    editing: false,
  };

  componentWillMount() {
    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: InternalProps) {
    this.loadDataIfNeeded(nextProps);
  }

  onDelete = (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { dispatch, errorHandler, collection } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorUsername: username } = collection;

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

  onSortSelect = (event: SyntheticEvent<HTMLSelectElement>) => {
    const { clientApp, editing, filters, lang, router } = this.props;

    event.preventDefault();

    const sortValue = event.currentTarget.value;
    const newFilters = {
      ...filters,
      collectionSort: sortValue,
    };

    const pathname = `/${lang}/${clientApp}${
      editing ? this.editUrl() : this.url()
    }`;
    router.push({
      pathname,
      query: convertFiltersToQueryParams(newFilters),
    });

    return false;
  };

  sortOptions() {
    const { i18n } = this.props;

    return [
      {
        label: i18n.gettext('Newest first'),
        value: COLLECTION_SORT_DATE_ADDED_DESCENDING,
      },
      {
        label: i18n.gettext('Oldest first'),
        value: COLLECTION_SORT_DATE_ADDED_ASCENDING,
      },
      {
        label: i18n.gettext('Name'),
        value: COLLECTION_SORT_NAME,
      },
      {
        label: i18n.gettext('Popularity'),
        value: COLLECTION_SORT_POPULARITY,
      },
    ];
  }

  loadDataIfNeeded(nextProps?: InternalProps) {
    const { collection, creating, errorHandler, loading, params } = {
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

  url() {
    const { params } = this.props;

    return `/collections/${params.username}/${params.slug}/`;
  }

  editUrl() {
    return `${this.url()}edit/`;
  }

  editCollectionLink() {
    const { _config, i18n, filters } = this.props;
    const props = {};

    if (_config.get('enableNewCollectionsUI')) {
      // TODO: make this a real link when the form is ready for release.
      // https://github.com/mozilla/addons-frontend/issues/4293
      props.to = {
        pathname: this.editUrl(),
        query: convertFiltersToQueryParams(filters),
      };
    } else {
      props.href = this.editUrl();
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
    const { collection, dispatch, errorHandler, filters } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorUsername: username } = collection;

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

    const { slug, authorUsername: username } = collection;

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

    const { slug, authorUsername: username } = collection;

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
      hasEditPermission,
      i18n,
      isLoggedIn,
      location,
    } = this.props;

    if (creating || editing) {
      if (!isLoggedIn) {
        const logInText = creating
          ? i18n.gettext('Log in to create a collection')
          : i18n.gettext('Log in to edit this collection');

        return (
          <AuthenticateButton
            noIcon
            location={location}
            logInText={logInText}
          />
        );
      }
      return (
        <CollectionManager
          collection={collection}
          creating={creating}
          filters={filters}
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
          ) : (
            <LoadingText />
          )}
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
              content: collection
                ? i18n.moment(collection.lastUpdatedDate).format('ll')
                : null,
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
    const { i18n, isOwner } = this.props;

    if (!isOwner) {
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
      creating,
      editing,
      filters,
      isLoggedIn,
      loading,
      i18n,
    } = this.props;

    const addons: Array<CollectionAddonType> =
      (collection && collection.addons) || [];

    const paginator =
      collection && collection.numberOfAddons > 0 ? (
        <Paginate
          LinkComponent={Link}
          count={collection.numberOfAddons}
          currentPage={filters.page}
          pathname={editing ? this.editUrl() : this.url()}
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

    return (
      <div className="Collection-wrapper">
        <div className="Collection-detail-wrapper">
          <Card className="Collection-detail">
            {this.renderCardContents()}
            {this.renderDeleteButton()}
          </Card>
          <Card className="Collection-sort">
            <form>
              <label className="Sort-label" htmlFor="Sort-Select">
                {i18n.gettext('Sort add-ons by')}
              </label>
              <Select
                className="Sort-select"
                defaultValue={filters.collectionSort}
                id="Sort-Select"
                name="sort"
                onChange={this.onSortSelect}
              >
                {this.sortOptions().map((option) => {
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </Select>
            </form>
          </Card>
        </div>
        <div className="Collection-items">
          {!creating && (
            <AddonsCard
              addonInstallSource={INSTALL_SOURCE_COLLECTION}
              addons={addons}
              deleteNote={this.deleteNote}
              editing={editing}
              footer={paginator}
              loading={!collection || loading}
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

export const mapStateToProps = (
  state: {|
    api: ApiStateType,
    collections: CollectionsState,
    users: UsersStateType,
  |},
  ownProps: InternalProps,
) => {
  const { loading } = state.collections.current;
  const { location } = ownProps;

  const filtersFromLocation = convertQueryParamsToFilters(location.query);
  const filters = {
    page: filtersFromLocation.page || 1,
    collectionSort:
      filtersFromLocation.collectionSort ||
      COLLECTION_SORT_DATE_ADDED_DESCENDING,
  };

  const currentUser = getCurrentUser(state.users);
  const collection = getCurrentCollection(state.collections);

  const isOwner =
    collection && currentUser && collection.authorId === currentUser.id;
  let hasEditPermission = false;

  if (collection && currentUser) {
    hasEditPermission =
      isOwner ||
      // User can edit mozilla collections, and it is a mozilla collection.
      (collection.authorUsername === MOZILLA_COLLECTIONS_USERNAME &&
        hasPermission(state, MOZILLA_COLLECTIONS_EDIT)) ||
      // User can edit the featured theme collection, and it is the featured
      // theme collection.
      (collection.authorUsername === MOZILLA_COLLECTIONS_USERNAME &&
        collection.slug === FEATURED_THEMES_COLLECTION_SLUG &&
        hasPermission(state, FEATURED_THEMES_COLLECTION_EDIT));
  }

  return {
    clientApp: state.api.clientApp,
    collection,
    filters,
    isLoggedIn: !!currentUser,
    isOwner,
    lang: state.api.lang,
    loading,
    hasEditPermission,
  };
};

export const extractId = (ownProps: InternalProps) => {
  return [
    ownProps.params.username,
    ownProps.params.slug,
    ownProps.location.query.page,
  ].join('/');
};

const Collection: React.ComponentType<Props> = compose(
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionBase);

export default Collection;
