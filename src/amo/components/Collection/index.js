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
  deleteCollectionAddonNotes,
  removeAddonFromCollection,
  deleteCollection,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  getCurrentCollection,
  updateCollectionAddon,
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
  creating: boolean,
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
export type DeleteAddonNoteFunc = (
  addonId: number, errorHandler: ErrorHandlerType
) => void;
export type SaveAddonNoteFunc = (
  addonId: number, errorHandler: ErrorHandlerType, notes: string
) => void;

export class CollectionBase extends React.Component<Props> {
  static defaultProps = {
    _config: config,
    creating: false,
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

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(removeAddonFromCollection({
      addonId,
      errorHandlerId: errorHandler.id,
      page: query.page || 1,
      slug,
      username,
    }));
  };

  deleteNote: DeleteAddonNoteFunc = (
    addonId: number, errorHandler: ErrorHandlerType
  ) => {
    const {
      collection,
      dispatch,
      location,
    } = this.props;

    invariant(collection, 'collection is required');

    const {
      slug,
      authorUsername: username,
    } = collection;

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(deleteCollectionAddonNotes({
      addonId,
      errorHandlerId: errorHandler.id,
      page: location.query.page || 1,
      slug,
      username,
    }));
  };

  saveNote: SaveAddonNoteFunc = (
    addonId: number, errorHandler: ErrorHandlerType, notes: string
  ) => {
    const {
      collection,
      dispatch,
      location,
    } = this.props;

    invariant(collection, 'collection is required');

    const {
      slug,
      authorUsername: username,
    } = collection;

    invariant(slug, 'slug is required');
    invariant(username, 'username is required');

    dispatch(updateCollectionAddon({
      addonId,
      errorHandlerId: errorHandler.id,
      notes,
      page: location.query.page || 1,
      slug,
      username,
    }));
  };

  renderCardContents() {
    const {
      collection, creating, editing, hasEditPermission, i18n, isLoggedIn, location,
    } = this.props;

    if (creating || editing) {
      if (!isLoggedIn) {
        const logInText = creating ?
          i18n.gettext('Log in to create a collection') :
          i18n.gettext('Log in to edit this collection');

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
      creating,
      editing,
      isLoggedIn,
      loading,
      location,
      i18n,
    } = this.props;

    const addons: Array<CollectionAddonType> =
      (collection && collection.addons) || [];

    const paginator = (collection && collection.numberOfAddons > 0) ? (
      <Paginate
        LinkComponent={Link}
        count={collection.numberOfAddons}
        currentPage={location.query.page}
        pathname={editing ? this.editUrl() : this.url()}
      />
    ) : null;

    let placeholderText;
    if (isLoggedIn && (creating || (!loading && addons.length === 0))) {
      placeholderText = creating ?
        i18n.gettext(
          'First, create your collection. Then you can add extensions and themes.'
        ) :
        i18n.gettext(
          'Search for extensions and themes to add to your collection.'
        );
    }

    return (
      <div className="Collection-wrapper">
        <Card className="Collection-detail">
          {this.renderCardContents()}
          {this.renderDeleteButton()}
        </Card>
        <div className="Collection-items">
          {!creating &&
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
          }
          {placeholderText &&
            <p className="Collection-placeholder">{ placeholderText }</p>
          }
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
  if (collection && currentUser) {
    hasEditPermission = collection.authorId === currentUser.id ||
      hasPermission(state, COLLECTIONS_EDIT);
  }

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
