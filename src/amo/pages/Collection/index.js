/* @flow */
import config from 'config';
import deepEqual from 'deep-eql';
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import CollectionAddAddon from 'amo/components/CollectionAddAddon';
import CollectionControls from 'amo/components/CollectionControls';
import CollectionDetailsCard from 'amo/components/CollectionDetailsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import { isFeaturedCollection } from 'amo/pages/Home';
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
import { getCurrentUser } from 'amo/reducers/users';
import AuthenticateButton from 'core/components/AuthenticateButton';
import Paginate from 'core/components/Paginate';
import {
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  INSTALL_SOURCE_COLLECTION,
  INSTALL_SOURCE_FEATURED_COLLECTION,
} from 'core/constants';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { sendServerRedirect } from 'core/reducers/redirectTo';
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
  ReactRouterHistoryType,
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
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  filters: CollectionFilters,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  isLoggedIn: boolean,
  isOwner: boolean,
  lang: string,
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {|
      slug: string,
      userId: string,
    |},
  |},
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

type ComputeNewCollectionPageParams = {|
  collection: CollectionType,
  currentPage: string,
|};

export const computeNewCollectionPage = ({
  collection,
  currentPage,
}: ComputeNewCollectionPageParams): string => {
  const { numberOfAddons, pageSize } = collection;

  let page = '1';
  if (pageSize) {
    const lastPage = Math.ceil((numberOfAddons - 1) / pageSize);

    // If we are not on the last page, we can just return the current page.
    if (parseInt(currentPage, 10) < lastPage) {
      return currentPage;
    }

    page = lastPage;
  }

  return page ? page.toString() : '1';
};

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
    this.loadDataIfNeeded();
  }

  maybeResetAddonPlaceholderCount() {
    const { collection } = this.props;
    if (collection && collection.addons && collection.addons.length) {
      // Store the previous count of collection add-ons for use as
      // the placeholder count when loading the next set of add-ons.
      this.addonPlaceholderCount = collection.addons.length;
    }
  }

  componentDidUpdate(prevProps: InternalProps) {
    this.loadDataIfNeeded(prevProps);
    this.maybeResetAddonPlaceholderCount();
  }

  onDelete = (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { dispatch, errorHandler, collection } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorUsername: userId } = collection;

    invariant(slug, 'slug is required');
    invariant(userId, 'userId is required');

    dispatch(
      deleteCollection({
        errorHandlerId: errorHandler.id,
        slug,
        userId,
      }),
    );
  };

  loadDataIfNeeded(prevProps?: InternalProps) {
    const {
      collection,
      creating,
      errorHandler,
      filters,
      loading,
      location,
      match: { params },
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (creating || loading) {
      return;
    }

    let collectionChanged = false;
    let addonsPageChanged = false;

    if (prevProps && prevProps.location && location) {
      if (prevProps.location.pathname !== location.pathname) {
        collectionChanged = true;
      }
    }

    if (prevProps && !deepEqual(prevProps.filters, filters)) {
      addonsPageChanged = true;
    }

    if (
      collection &&
      (collection.slug.toLowerCase() !== params.slug.toLowerCase() ||
        collection.authorUsername.toLowerCase() !== params.userId.toLowerCase())
    ) {
      collectionChanged = true;
    }

    // See: https://github.com/mozilla/addons-frontend/issues/4271
    if (
      !collectionChanged &&
      collection &&
      (params.userId !== collection.authorUsername ||
        params.slug !== collection.slug)
    ) {
      const { lang, clientApp } = this.props;

      this.props.dispatch(
        sendServerRedirect({
          status: 301,
          url: `/${lang}/${clientApp}/collections/${
            collection.authorUsername
          }/${collection.slug}/`,
        }),
      );
      return;
    }

    if (!collection || collectionChanged) {
      this.props.dispatch(
        fetchCurrentCollection({
          errorHandlerId: errorHandler.id,
          filters,
          slug: params.slug,
          userId: params.userId,
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
          userId: params.userId,
        }),
      );
    }
  }

  removeAddon: RemoveCollectionAddonFunc = (addonId: number) => {
    const { collection, dispatch, errorHandler, filters, history } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorUsername: userId } = collection;

    invariant(slug, 'slug is required');
    invariant(userId, 'userId is required');

    let { page } = filters;
    let shouldPushNewRoute = false;

    const newCollectionPage = computeNewCollectionPage({
      collection,
      currentPage: page,
    });

    if (page !== newCollectionPage) {
      page = newCollectionPage;
      shouldPushNewRoute = true;
    }

    dispatch(
      removeAddonFromCollection({
        addonId,
        errorHandlerId: errorHandler.id,
        filters: {
          ...filters,
          page,
        },
        slug,
        userId,
      }),
    );

    if (shouldPushNewRoute) {
      const { location } = history;

      history.push({
        pathname: location.pathname,
        query: {
          ...location.query,
          page,
        },
      });
    }
  };

  deleteNote: DeleteAddonNoteFunc = (
    addonId: number,
    errorHandler: ErrorHandlerType,
  ) => {
    const { collection, dispatch, filters } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorUsername: userId } = collection;

    invariant(slug, 'slug is required');
    invariant(userId, 'userId is required');

    dispatch(
      deleteCollectionAddonNotes({
        addonId,
        errorHandlerId: errorHandler.id,
        filters,
        slug,
        userId,
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

    const { slug, authorUsername: userId } = collection;

    invariant(slug, 'slug is required');
    invariant(userId, 'userId is required');

    dispatch(
      updateCollectionAddon({
        addonId,
        errorHandlerId: errorHandler.id,
        notes,
        filters,
        slug,
        userId,
      }),
    );
  };

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
    } = this.props;

    if ((creating || editing) && !isLoggedIn) {
      const logInText = creating
        ? i18n.gettext('Log in to create a collection')
        : i18n.gettext('Log in to edit this collection');

      return (
        <Card className="Collection-login">
          <AuthenticateButton noIcon logInText={logInText} />
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
            <CollectionDetailsCard
              collection={collection}
              creating={creating}
              editing={editing}
              filters={filters}
            />
            {this.renderDeleteButton()}
          </Card>
          {!creating && (
            <CollectionControls
              collection={collection}
              editing={editing}
              filters={filters}
            />
          )}
        </div>
        <div className="Collection-items">
          {editing && (
            <CollectionAddAddon collection={collection} filters={filters} />
          )}
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

  getPageDescription() {
    const { collection, i18n } = this.props;

    invariant(collection, 'collection is required');

    return i18n.sprintf(
      collection.description
        ? i18n.gettext(`Download and create Firefox collections to keep track
          of favorite extensions and themes. Explore the
          %(collectionName)s—%(collectionDescription)s.`)
        : i18n.gettext(`Download and create Firefox collections to keep track
          of favorite extensions and themes. Explore the %(collectionName)s.`),
      {
        collectionName: collection.name,
        collectionDescription: collection.description,
      },
    );
  }

  render() {
    const { collection, errorHandler } = this.props;

    if (errorHandler.hasError()) {
      log.warn(`Captured API Error: ${errorHandler.capturedError.messages}`);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFound errorCode={errorHandler.capturedError.code} />;
      }
    }

    return (
      <div className="Collection">
        {collection && (
          <Helmet>
            <title>{collection.name}</title>
            <meta name="description" content={this.getPageDescription()} />
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        {this.renderCollection()}
      </div>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: InternalProps) => {
  const { api, collections } = state;

  const { loading } = collections.current;
  const { creating, location } = ownProps;

  const filters = {
    page: location.query.page || '1',
    collectionSort:
      location.query.collection_sort || COLLECTION_SORT_DATE_ADDED_DESCENDING,
  };

  const currentUser = getCurrentUser(state.users);
  const collection = creating ? null : getCurrentCollection(state.collections);

  const isOwner =
    collection && currentUser && collection.authorId === currentUser.id;

  return {
    clientApp: api.clientApp,
    collection,
    filters,
    isLoggedIn: !!currentUser,
    isOwner,
    lang: api.lang,
    loading,
  };
};

export const extractId = (ownProps: InternalProps) => {
  return [
    ownProps.match.params.userId,
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
