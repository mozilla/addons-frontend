/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import config from 'config';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import { updateCollection } from 'amo/reducers/collections';
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
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  router: ReactRouterType,
  siteLang: ?string,
  isCollectionBeingModified: boolean,
|};

type State = {|
  description?: string | null,
  name?: string | null,
  slug?: string | null,
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
      collection, clientApp, errorHandler, router, siteLang,
    } = this.props;
    event.preventDefault();
    event.stopPropagation();
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
      collection,
      errorHandler,
      dispatch,
      i18n,
      siteLang,
    } = this.props;
    event.preventDefault();
    event.stopPropagation();

    let { name, slug } = this.state;

    name = name && name.trim();
    slug = slug && slug.trim();

    if (!collection) {
      // You'd have to click really fast to access a form without a
      // collection so a user will not likely see this.
      throw new Error(
        'The form cannot be submitted without a collection');
    }
    if (!siteLang) {
      // It is not possible to browse the site without a language so
      // a user will not likely see this.
      throw new Error(
        'The form cannot be submitted without a site language');
    }

    // Do some form validation.
    if (!this.state.name) {
      errorHandler.addMessage(
        i18n.gettext('Collection name cannot be blank')
      );
      return;
    }

    dispatch(updateCollection({
      collectionSlug: collection.slug,
      defaultLocale: collection.defaultLocale,
      description: { [siteLang]: this.state.description },
      errorHandlerId: errorHandler.id,
      name: { [siteLang]: name },
      user: collection.authorUsername,
      slug,
    }));
  };

  onTextInput = (
    event: ElementEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.preventDefault();
    this.setState({ [event.target.name]: event.target.value });
  };

  onSearchAddon = (filters: SearchFilters) => {
    // TODO: implement onSearchAddon
    // https://github.com/mozilla/addons-frontend/issues/4590
    log.debug('TODO: handle seaching for add-on', filters);
  };

  onAddonSelected = (suggestion: SuggestionType) => {
    // TODO: implement onAddonSelected
    // https://github.com/mozilla/addons-frontend/issues/4590
    log.debug('TODO: handle selecting an add-on', suggestion);
  };

  propsToState(props: Props) {
    // Decode HTML entities so the user sees real symbols in the form.
    return {
      description: props.collection &&
        decodeHtmlEntities(props.collection.description),
      name: props.collection && decodeHtmlEntities(props.collection.name),
      slug: props.collection && props.collection.slug,
    };
  }

  render() {
    const {
      collection, errorHandler, i18n, isCollectionBeingModified, siteLang,
    } = this.props;
    const { name, slug } = this.state;

    let collectionUrlPrefix = '';
    if (collection && siteLang) {
      const apiHost = config.get('apiHost');
      const { authorUsername } = collection;
      collectionUrlPrefix =
        `${apiHost}/${siteLang}/firefox/collections/${authorUsername}/`;
    }

    // TODO: also disable the form while submitting.
    // https://github.com/mozilla/addons-frontend/issues/4635
    // The collectionUpdates state will handle this but it needs
    // to be hooked up the saga.
    const formIsDisabled = !collection || isCollectionBeingModified;
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
        {collection ? (
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
        {collection ? (
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
  state: {| api: ApiStateType, collections: CollectionsState |},
) => {
  return {
    clientApp: state.api.clientApp,
    siteLang: state.api.lang,
    isCollectionBeingModified: state.collections.isCollectionBeingModified,
  };
};

export default compose(
  withRouter,
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionManagerBase);
