/* @flow */
import deepEqual from 'deep-eql';
import invariant from 'invariant';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import AddonsCard from 'amo/components/AddonsCard';
import Button from 'amo/components/Button';
import CollectionAddAddon from 'amo/components/CollectionAddAddon';
import CollectionControls from 'amo/components/CollectionControls';
import CollectionDetailsCard from 'amo/components/CollectionDetailsCard';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Link from 'amo/components/Link';
import Page from 'amo/components/Page';
import {
  collectionEditUrl,
  collectionName,
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
import AuthenticateButton from 'amo/components/AuthenticateButton';
import Paginate from 'amo/components/Paginate';
import {
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  INSTALL_SOURCE_COLLECTION,
} from 'amo/constants';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import Card from 'amo/components/Card';
import ConfirmButton from 'amo/components/ConfirmButton';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { CollectionAddonType } from 'amo/types/addons';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'amo/types/router';

import './styles.scss';

export const DEFAULT_ADDON_PLACEHOLDER_COUNT = 3;

export type DefaultProps = {|
  creating: boolean,
  editing: boolean,
|};

export type Props = DefaultProps;

type PropsFromState = {|
  clientApp: string,
  collection: CollectionType | null,
  filters: CollectionFilters,
  isLoggedIn: boolean,
  isOwner: boolean,
  lang: string,
  loading: boolean,
  isReported: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  history: ReactRouterHistoryType,
  i18n: I18nType,
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

  let page: number | string = '1';
  if (pageSize && numberOfAddons) {
    const lastPage = Math.ceil((numberOfAddons - 1) / Number(pageSize));

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

  static defaultProps: {|
    ...DefaultProps,
  |} = {
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

  onDelete: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    const { dispatch, errorHandler, collection } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorId: userId } = collection;

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

    if (collection) {
      let isSameCollectionUser;
      // Is `userId` a numeric ID?
      if (/^\d+$/.test(params.userId)) {
        isSameCollectionUser = `${collection.authorId}` === params.userId;
      } else {
        isSameCollectionUser =
          collection.authorUsername.toLowerCase() ===
          params.userId.toLowerCase();
      }

      if (
        collection.slug.toLowerCase() !== params.slug.toLowerCase() ||
        isSameCollectionUser === false
      ) {
        collectionChanged = true;
      }
    }

    // See: https://github.com/mozilla/addons-frontend/issues/4271
    if (!collectionChanged && collection) {
      if (params.slug !== collection.slug || !/^\d+$/.test(params.userId)) {
        const { editing, lang, clientApp } = this.props;

        const path = editing
          ? collectionEditUrl({ collection })
          : collectionUrl({ collection });

        this.props.dispatch(
          sendServerRedirect({
            status: 301,
            url: `/${lang}/${clientApp}${path}`,
          }),
        );
        return;
      }
    }

    if (!collection || collectionChanged) {
      this.props.dispatch(
        fetchCurrentCollection({
          errorHandlerId: errorHandler.id,
          filters,
          slug: params.slug,
          // It is possible that `userId` is  a `username` (string value) for
          // backward compatibility purpose.
          // $FlowIgnore
          userId: Number(params.userId) || params.userId,
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
          userId: Number(params.userId),
        }),
      );
    }
  }

  removeAddon: RemoveCollectionAddonFunc = (addonId: number) => {
    const { collection, dispatch, errorHandler, filters, history } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorId: userId } = collection;

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
    const { collection, dispatch, filters, lang } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorId: userId } = collection;

    invariant(slug, 'slug is required');
    invariant(userId, 'userId is required');

    dispatch(
      deleteCollectionAddonNotes({
        addonId,
        errorHandlerId: errorHandler.id,
        filters,
        lang,
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
    const { collection, dispatch, filters, lang } = this.props;

    invariant(collection, 'collection is required');

    const { slug, authorId: userId } = collection;

    invariant(slug, 'slug is required');
    invariant(userId, 'userId is required');

    dispatch(
      updateCollectionAddon({
        addonId,
        errorHandlerId: errorHandler.id,
        notes: { [lang]: notes },
        filters,
        slug,
        userId,
      }),
    );
  };

  renderDeleteButton(): null | React.Node {
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

  renderAbuseReportButton(): null | React.Node {
    if (!config.get('enableFeatureFeedbackFormLinks')) {
      return null;
    }

    const { collection, i18n, isOwner, isReported } = this.props;

    if (!collection || isOwner) {
      return null;
    }

    if (isReported) {
      return (
        <div className="Collection-report-sent">
          <h3 className="ReportUserAbuse-header">
            {i18n.gettext('You reported this collection')}
          </h3>

          <p>
            {i18n.gettext(`We have received your report. Thanks for letting us
              know about your concerns with this collection.`)}
          </p>
        </div>
      );
    }

    return (
      <Button
        buttonType="neutral"
        className="Collection-report-button"
        puffy
        to={`/feedback/collection/${collection.authorId}/${collection.slug}/`}
      >
        {i18n.gettext('Report this collection for abuse')}
      </Button>
    );
  }

  renderCollection(): React.Node {
    const {
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
          <AuthenticateButton noIcon logInText={logInText} />
        </Card>
      );
    }

    const addons: Array<CollectionAddonType> =
      (collection && collection.addons) || [];

    const paginator =
      collection &&
      collection.pageSize &&
      collection.numberOfAddons &&
      collection.numberOfAddons > Number(collection.pageSize) ? (
        <Paginate
          LinkComponent={Link}
          count={collection.numberOfAddons}
          currentPage={filters.page}
          pathname={
            editing
              ? collectionEditUrl({ collection })
              : collectionUrl({ collection })
          }
          perPage={Number(collection.pageSize)}
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
            <CollectionDetailsCard
              collection={collection}
              creating={creating}
              editing={editing}
              filters={filters}
            />
            {this.renderDeleteButton()}
            {this.renderAbuseReportButton()}
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
              addonInstallSource={
                location.query.addonInstallSource || INSTALL_SOURCE_COLLECTION
              }
              addons={addons}
              deleteNote={this.deleteNote}
              editing={editing}
              footer={paginator}
              loading={!collection || loading}
              placeholderCount={this.addonPlaceholderCount}
              removeAddon={this.removeAddon}
              saveNote={this.saveNote}
              showFullSizePreview
            />
          )}
          {placeholderText && (
            <p className="Collection-placeholder">{placeholderText}</p>
          )}
        </div>
      </div>
    );
  }

  getPageDescription(): string {
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
        collectionName: collectionName({ name: collection.name, i18n }),
        collectionDescription: collection.description,
      },
    );
  }

  render(): React.Node {
    const { collection, errorHandler, i18n } = this.props;

    if (errorHandler.hasError()) {
      log.warn(`Captured API Error: ${errorHandler.capturedError.messages}`);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFoundPage />;
      }
    }

    return (
      <Page>
        <div className="Collection">
          {collection && (
            <Helmet>
              <title>{collectionName({ name: collection.name, i18n })}</title>
              <meta name="description" content={this.getPageDescription()} />
            </Helmet>
          )}

          {errorHandler.renderErrorIfPresent()}

          {this.renderCollection()}
        </div>
      </Page>
    );
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: InternalProps,
): PropsFromState => {
  const { api, collections, collectionAbuseReports } = state;

  const { loading } = collections.current;
  const { creating, location } = ownProps;

  const filters = {
    page: location.query.page || '1',
    collectionSort:
      location.query.collection_sort || COLLECTION_SORT_DATE_ADDED_DESCENDING,
  };

  const currentUser = getCurrentUser(state.users);
  const collection = creating ? null : getCurrentCollection(state.collections);

  const isOwner = Boolean(
    collection && currentUser && collection.authorId === currentUser.id,
  );

  const abuseReport =
    (collection && collectionAbuseReports.byCollectionId[collection.id]) ||
    null;

  return {
    clientApp: api.clientApp,
    collection,
    filters,
    isLoggedIn: !!currentUser,
    isOwner,
    lang: api.lang,
    loading,
    isReported: abuseReport?.hasSubmitted || false,
  };
};

export const extractId = (ownProps: InternalProps): string => {
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
