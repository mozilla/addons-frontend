/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import { updateCollection } from 'amo/reducers/collections';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { decodeHtmlEntities } from 'core/utils';
import FormOverlay from 'ui/components/FormOverlay';
import type { CollectionType } from 'amo/reducers/collections';
import type { ApiStateType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { ElementEvent } from 'core/types/dom';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';

type Props = {|
  collection: CollectionType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  siteLang: ?string,
|};

type State = {|
  description?: string | null,
  name?: string | null,
  slug?: string | null,
|};

export const COLLECTION_OVERLAY = 'COLLECTION_OVERLAY';

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

  onCancel = () => {
    const { errorHandler } = this.props;

    // Reset form state to the original collection object.
    this.setState(this.propsToState(this.props));
    errorHandler.clear();
  }

  onSubmit = () => {
    const {
      collection,
      errorHandler,
      dispatch,
      i18n,
      siteLang,
    } = this.props;

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
      formOverlayId: COLLECTION_OVERLAY,
      name: { [siteLang]: this.state.name },
      user: collection.authorUsername,
      slug: this.state.slug,
    }));
  }

  onTextInput = (
    event: ElementEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.preventDefault();
    this.setState({ [event.target.name]: event.target.value });
  }

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
    const { collection, errorHandler, i18n, siteLang } = this.props;

    let collectionUrlPrefix = '';
    if (collection && siteLang) {
      const apiHost = config.get('apiHost');
      const { authorUsername } = collection;
      collectionUrlPrefix =
        `${apiHost}/${siteLang}/firefox/collections/${authorUsername}/`;
    }

    return (
      <FormOverlay
        className="CollectionManager"
        id={COLLECTION_OVERLAY}
        onCancel={this.onCancel}
        onSubmit={this.onSubmit}
        submitText={i18n.gettext('Save collection')}
        submittingText={i18n.gettext('Saving collection')}
        title={i18n.gettext('Edit collection')}
      >
        {errorHandler.renderErrorIfPresent()}
        <label htmlFor="collectionName">
          {i18n.gettext('Collection name')}
        </label>
        <input
          onChange={this.onTextInput}
          id="collectionName"
          name="name"
          type="text"
          value={this.state.name}
        />
        <label htmlFor="collectionDescription">
          {i18n.gettext('Description')}
        </label>
        <textarea
          defaultValue={this.state.description}
          id="collectionDescription"
          name="description"
          onChange={this.onTextInput}
        />
        <label htmlFor="collectionSlug">
          {i18n.gettext('Custom URL')}
        </label>
        <div className="CollectionManager-slug">
          <div className="CollectionManager-slug-url-hint">
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
      </FormOverlay>
    );
  }
}

export const extractId = (ownProps: Props) => {
  const { collection } = ownProps;
  return `collection-${collection ? collection.slug : ''}`;
};

export const mapStateToProps = (state: {| api: ApiStateType |}) => {
  return {
    siteLang: state.api.lang,
  };
};

export default compose(
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionManagerBase);
