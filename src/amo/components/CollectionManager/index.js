/* @flow */
import { oneLineTrim } from 'common-tags';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import config from 'config';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import {
  addAddonToCollection,
  createCollection,
  updateCollection,
} from 'amo/reducers/collections';
import { getCurrentUser } from 'amo/reducers/users';
import { withFixedErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import { decodeHtmlEntities } from 'core/utils';
import Button from 'ui/components/Button';
import LoadingText from 'ui/components/LoadingText';
import type {
  SearchFilters, SuggestionType,
} from 'amo/components/AutoSearchInput';
import type {
  CollectionsState,
  CollectionType,
} from 'amo/reducers/collections';
import type { UsersStateType } from 'amo/reducers/users';
import type { ApiStateType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { ElementEvent } from 'core/types/dom';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterType } from 'core/types/router';

import './styles.scss';

type Props = {|
  collection: CollectionType | null,
  clientApp: ?string,
  creating: boolean,
  currentUsername: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isCollectionBeingModified: boolean,
  router: ReactRouterType,
  siteLang: ?string,
  siteUserId: number | null,
|};

type State = {|
  description?: string | null,
  name?: string | null,
  slug?: string | null,
  customSlug?: boolean,
|};

export class CollectionManagerBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = this.propsToState(props);
  }

  componentWillReceiveProps(props: Props) {
    const existingId = this.props.collection && this.props.collection.id;
    if (props.collection && props.collection.id !== existingId) {
      // Only reset the form when receiving a collection that the
      // user is not already editing. This prevents clearing the form
      // in a few scenarios such as pressing the submit button.
      this.setState(this.propsToState(props));
    }
  }

  onCancel = (event: SyntheticEvent<any>) => {
    const {
      clientApp, collection, creating, errorHandler, router, siteLang,
    } = this.props;
    event.preventDefault();
    event.stopPropagation();

    if (creating) {
      router.goBack();
    }

    invariant(collection,
      'A collection must be loaded before you can cancel');
    invariant(clientApp,
      'A clientApp must be loaded before you can cancel');
    invariant(siteLang,
      'A siteLang must be loaded before you can cancel');

    // Reset form state to the original collection object.
    this.setState(this.propsToState(this.props));
    errorHandler.clear();

    const { authorUsername, slug } = collection;
    router.push(
      `/${siteLang}/${clientApp}/collections/${authorUsername}/${slug}/`
    );
  };

  onSubmit = (event: SyntheticEvent<any>) => {
    const {
      creating,
      collection,
      currentUsername,
      dispatch,
      errorHandler,
      siteLang,
    } = this.props;
    event.preventDefault();
    event.stopPropagation();

    let { name, slug } = this.state;

    name = name && name.trim();
    slug = slug && slug.trim();

    invariant(siteLang,
      'The form cannot be submitted without a site language');
    invariant(name,
      'The form cannot be submitted without a name');
    invariant(slug,
      'The form cannot be submitted without a slug');

    const payload = {
      description: { [siteLang]: this.state.description },
      errorHandlerId: errorHandler.id,
      name: { [siteLang]: name },
      slug,
    };

    if (creating) {
      dispatch(createCollection({
        ...payload,
        defaultLocale: siteLang,
        user: currentUsername,
      }));
    } else {
      invariant(collection,
        'The form cannot be submitted without a collection');
      dispatch(updateCollection({
        ...payload,
        collectionSlug: collection.slug,
        defaultLocale: collection.defaultLocale,
        user: collection.authorUsername,
      }));
    }
  };

  onTextInput = (
    event: ElementEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.preventDefault();
    const { name, value } = event.target;
    const { creating } = this.props;

    if (value === null || typeof value === 'undefined') return;
    const trimmedValue = value.trim();

    if (creating && name === 'name' && !this.state.customSlug) {
      this.setState({
        slug: trimmedValue.replace(/[^A-Za-z0-9]/g, '-'),
        [name]: value,
      });
    } else if (creating && name === 'slug' && trimmedValue !== '') {
      this.setState({
        customSlug: true,
        [name]: value,
      });
    } else {
      this.setState({ [name]: value });
    }
  };

  onSearchAddon = (filters: SearchFilters) => {
    // TODO: implement onSearchAddon
    // https://github.com/mozilla/addons-frontend/issues/4590
    log.debug('TODO: handle seaching for add-on', filters);
  };

  onAddonSelected = (suggestion: SuggestionType) => {
    const { collection, errorHandler, dispatch, siteUserId } = this.props;
    const { addonId } = suggestion;

    invariant(addonId, 'addonId cannot be empty');
    invariant(collection,
      'A collection must be loaded before you can add an add-on to it');
    invariant(siteUserId,
      'Cannot add to collection because you are not signed in');

    dispatch(addAddonToCollection({
      addonId,
      collectionId: collection.id,
      collectionSlug: collection.slug,
      editing: true,
      errorHandlerId: errorHandler.id,
      userId: siteUserId,
    }));
  };

  propsToState(props: Props) {
    // Decode HTML entities so the user sees real symbols in the form.
    return {
      customSlug: false,
      description: props.collection &&
        decodeHtmlEntities(props.collection.description),
      name: props.collection && decodeHtmlEntities(props.collection.name),
      slug: props.collection && props.collection.slug,
    };
  }

  render() {
    const {
      collection,
      creating,
      currentUsername,
      errorHandler,
      i18n,
      isCollectionBeingModified,
      siteLang,
    } = this.props;
    const { name, slug } = this.state;

    const collectionUrlPrefix =
      oneLineTrim`${config.get('apiHost')}/${siteLang}/firefox/collections/
       ${(collection && collection.authorUsername) || currentUsername}/`;

    const formIsDisabled = (!collection && !creating) ||
                           isCollectionBeingModified;
    const isNameBlank = !(name && name.trim().length);
    const isSlugBlank = !(slug && slug.trim().length);
    const isSubmitDisabled = formIsDisabled || isNameBlank || isSlugBlank;

    return (
      <form
        className="CollectionManager"
        onSubmit={this.onSubmit}
      >
        {errorHandler.renderErrorIfPresent()}
        <label
          className="CollectionManager-collectionName"
          htmlFor="collectionName"
        >
          {i18n.gettext('Collection name')}
        </label>
        {collection || creating ? (
          <input
            onChange={this.onTextInput}
            id="collectionName"
            name="name"
            type="text"
            value={this.state.name}
          />
        ) : <LoadingText minWidth={60} />}
        <label htmlFor="collectionDescription">
          {i18n.gettext('Description')}
        </label>
        {collection || creating ? (
          <textarea
            value={this.state.description}
            id="collectionDescription"
            name="description"
            onChange={this.onTextInput}
          />
        ) : <LoadingText minWidth={60} />}
        <label htmlFor="collectionSlug">
          {i18n.gettext('Custom URL')}
        </label>
        <div className="CollectionManager-slug">
          <div
            id="collectionUrlPrefix"
            title={collectionUrlPrefix}
            className="CollectionManager-slug-url-hint"
          >
            {/*
              &lrm; (left-to-right mark) is an invisible control
              character. It's added to prevent the bi-directional
              trailing slash character (in the URL) from getting
              reversed when using direction: rtl.
            */}
            {collectionUrlPrefix}&lrm;
          </div>
          <input
            onChange={this.onTextInput}
            id="collectionSlug"
            name="slug"
            type="text"
            value={this.state.slug}
          />
        </div>
        <AutoSearchInput
          inputName="collection-addon-query"
          inputPlaceholder={
            i18n.gettext('Find an add-on to include in this collection')
          }
          onSearch={this.onSearchAddon}
          onSuggestionSelected={this.onAddonSelected}
          selectSuggestionText={i18n.gettext('Add to collection')}
        />
        <footer className="CollectionManager-footer">
          {/*
            type=button is necessary to override the default
            of type=submit
          */}
          <Button
            buttonType="neutral"
            disabled={formIsDisabled}
            onClick={this.onCancel}
            className="CollectionManager-cancel"
            puffy
            type="button"
          >
            {i18n.gettext('Cancel')}
          </Button>
          <Button
            buttonType="action"
            disabled={isSubmitDisabled}
            className="CollectionManager-submit"
            type="submit"
            puffy
          >
            {i18n.gettext('Save Collection')}
          </Button>
        </footer>
      </form>
    );
  }
}

export const extractId = (ownProps: Props) => {
  const { collection } = ownProps;
  return `collection-${collection ? collection.slug : ''}`;
};

export const mapStateToProps = (
  state: {|
    api: ApiStateType,
    collections: CollectionsState,
    users: UsersStateType,
  |}
) => {
  const currentUser = getCurrentUser(state.users);
  return {
    clientApp: state.api.clientApp,
    currentUsername: currentUser && currentUser.username,
    isCollectionBeingModified: state.collections.isCollectionBeingModified,
    siteLang: state.api.lang,
    siteUserId: state.users.currentUserID,
  };
};

export default compose(
  withRouter,
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionManagerBase);
