/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { updateCollection } from 'amo/reducers/collections';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import FormOverlay from 'ui/components/FormOverlay';
import type { CollectionType } from 'amo/reducers/collections';
import type { ApiStateType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { ElementEvent } from 'core/types/dom';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { DispatchFunc } from 'core/types/redux';

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
      description: { [siteLang]: this.state.description },
      errorHandlerId: errorHandler.id,
      formOverlayId: COLLECTION_OVERLAY,
      name: { [siteLang]: this.state.name },
      user: collection.authorId,
    }));
  }

  onTextInput = (
    event: ElementEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.preventDefault();
    this.setState({ [event.target.name]: event.target.value });
  }

  propsToState(props: Props) {
    return {
      description: props.collection && props.collection.description,
      name: props.collection && props.collection.name,
    };
  }

  render() {
    const { errorHandler, i18n } = this.props;

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
