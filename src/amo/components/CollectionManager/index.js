/* @flow */
import { oneLineTrim } from 'common-tags';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import config from 'config';

import {
  createCollection,
  finishEditingCollectionDetails,
  updateCollection,
} from 'amo/reducers/collections';
import { getCurrentUser } from 'amo/reducers/users';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { decodeHtmlEntities } from 'core/utils';
import Button from 'ui/components/Button';
import LoadingText from 'ui/components/LoadingText';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { ElementEvent } from 'core/types/dom';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
} from 'core/types/router';

import './styles.scss';

type Props = {|
  collection: CollectionType | null,
  creating: boolean,
  filters: CollectionFilters,
|};

type InternalProps = {|
  ...Props,
  clientApp: string,
  currentUsername: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  isCollectionBeingModified: boolean,
  location: ReactRouterLocationType,
  siteLang: ?string,
|};

type State = {|
  customSlug?: boolean,
  description?: string | null,
  name?: string | null,
  slug?: string | null,
|};

export class CollectionManagerBase extends React.Component<
  InternalProps,
  State,
> {
  constructor(props: InternalProps) {
    super(props);
    this.state = this.propsToState(props);
  }

  componentWillReceiveProps(props: InternalProps) {
    const existingId = this.props.collection && this.props.collection.id;
    if (props.collection && props.collection.id !== existingId) {
      // Only reset the form when receiving a collection that the
      // user is not already editing. This prevents clearing the form
      // in a few scenarios such as pressing the submit button.
      this.setState(this.propsToState(props));
    }
  }

  onCancel = (event: SyntheticEvent<HTMLButtonElement>) => {
    const { clientApp, creating, dispatch, history, siteLang } = this.props;

    if (creating) {
      if (siteLang) {
        history.push(`/${siteLang}/${clientApp}/collections/`);
      } else {
        history.goBack();
      }
    }

    event.preventDefault();
    event.stopPropagation();

    dispatch(finishEditingCollectionDetails());
  };

  onSubmit = (event: SyntheticEvent<any>) => {
    const {
      collection,
      creating,
      currentUsername,
      dispatch,
      errorHandler,
      filters,
      location,
      siteLang,
    } = this.props;
    event.preventDefault();
    event.stopPropagation();

    let { name, slug } = this.state;

    name = name && name.trim();
    slug = slug && slug.trim();

    invariant(siteLang, 'The form cannot be submitted without a site language');
    invariant(name, 'The form cannot be submitted without a name');
    invariant(slug, 'The form cannot be submitted without a slug');

    const payload = {
      description: { [siteLang]: this.state.description },
      errorHandlerId: errorHandler.id,
      name: { [siteLang]: name },
      slug,
    };

    if (creating) {
      dispatch(
        createCollection({
          ...payload,
          defaultLocale: siteLang,
          // query parameter values are string, not number.
          // $FLOW_FIXME: https://github.com/mozilla/addons-frontend/issues/5737
          includeAddonId: location.query.include_addon_id,
          username: currentUsername,
        }),
      );
    } else {
      invariant(
        collection,
        'The form cannot be submitted without a collection',
      );
      dispatch(
        updateCollection({
          ...payload,
          collectionSlug: collection.slug,
          defaultLocale: collection.defaultLocale,
          filters,
          username: collection.authorUsername,
        }),
      );
    }
  };

  onTextInput = (
    event: ElementEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    event.preventDefault();
    const { name, value } = event.target;
    const { creating } = this.props;

    if (value === null || typeof value === 'undefined') {
      return;
    }

    const trimmedValue = value.trim();

    if (creating && name === 'name' && !this.state.customSlug) {
      this.setState({
        slug: trimmedValue
          .split(/[^A-Za-z0-9]/)
          .filter((s) => s !== '')
          .join('-'),
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

  propsToState(props: InternalProps) {
    // Decode HTML entities so the user sees real symbols in the form.
    return {
      customSlug: false,
      description:
        props.collection && decodeHtmlEntities(props.collection.description),
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
    const { description, name, slug } = this.state;

    const collectionUrlPrefix = oneLineTrim`${config.get(
      'apiHost',
    )}/${siteLang}/firefox/collections/
       ${(collection && collection.authorUsername) || currentUsername}/`;

    const formIsUnchanged =
      collection &&
      (collection.name === name &&
        collection.slug === slug &&
        (collection.description === description ||
          (collection.description === null && !description)));
    const formIsDisabled =
      (!collection && !creating) || isCollectionBeingModified;
    const isNameBlank = !(name && name.trim().length);
    const isSlugBlank = !(slug && slug.trim().length);
    const isSubmitDisabled =
      formIsDisabled || formIsUnchanged || isNameBlank || isSlugBlank;
    const buttonText = creating
      ? i18n.gettext('Create collection')
      : i18n.gettext('Save changes');

    return (
      <form className="CollectionManager" onSubmit={this.onSubmit}>
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
        ) : (
          <LoadingText minWidth={60} />
        )}
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
        ) : (
          <LoadingText minWidth={60} />
        )}
        <label htmlFor="collectionSlug">{i18n.gettext('Custom URL')}</label>
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
            {collectionUrlPrefix}
            &lrm;
          </div>
          <input
            onChange={this.onTextInput}
            id="collectionSlug"
            name="slug"
            type="text"
            value={this.state.slug}
          />
        </div>
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
            {buttonText}
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

export const mapStateToProps = (state: AppState) => {
  const currentUser = getCurrentUser(state.users);

  return {
    clientApp: state.api.clientApp,
    currentUsername: currentUser && currentUser.username,
    isCollectionBeingModified: state.collections.isCollectionBeingModified,
    siteLang: state.api.lang,
  };
};

const CollectionManager: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
)(CollectionManagerBase);

export default CollectionManager;
