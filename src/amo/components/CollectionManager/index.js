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
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import LoadingText from 'amo/components/LoadingText';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { UserId } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type {
  ElementEvent,
  HTMLElementEventHandler,
  InputOrTextAreaEvent,
} from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { DispatchFunc } from 'amo/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
} from 'amo/types/router';

import './styles.scss';

type Props = {|
  collection: CollectionType | null,
  creating: boolean,
  filters: CollectionFilters,
|};

type PropsFromState = {|
  clientApp: string,
  currentUserId: UserId | null,
  isCollectionBeingModified: boolean,
  siteLang: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

type State = {|
  collectionId: number | null,
  customSlug: boolean,
  description: string,
  name: string,
  slug: string,
|};

export const SLUG_MAX_LENGTH = 30;

const propsToState = (props: InternalProps): State => {
  // Decode HTML entities so the user sees real symbols in the form.
  return {
    collectionId: props.collection ? props.collection.id : null,
    customSlug: false,
    description:
      props.collection && props.collection.description
        ? props.collection.description
        : '',
    name: props.collection ? props.collection.name : '',
    slug: props.collection ? props.collection.slug : '',
  };
};

export class CollectionManagerBase extends React.Component<
  InternalProps,
  State,
> {
  static getDerivedStateFromProps(
    props: InternalProps,
    state: State,
  ): null | State {
    if (props.collection && props.collection.id !== state.collectionId) {
      // Only reset the form when receiving a collection that the user is not
      // already editing. This prevents clearing the form in a few scenarios
      // such as pressing the submit button.
      return propsToState(props);
    }

    return null;
  }

  constructor(props: InternalProps) {
    super(props);

    this.state = propsToState(props);
  }

  onCancel: HTMLElementEventHandler = (event: ElementEvent) => {
    const { clientApp, creating, dispatch, history, siteLang } = this.props;

    if (creating) {
      history.push(`/${siteLang}/${clientApp}/collections/`);
    }

    event.preventDefault();
    event.stopPropagation();

    dispatch(finishEditingCollectionDetails());
  };

  onSubmit: HTMLElementEventHandler = (event: ElementEvent) => {
    const {
      collection,
      creating,
      currentUserId,
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

    if (creating && currentUserId) {
      dispatch(
        createCollection({
          ...payload,
          defaultLocale: siteLang,
          // query parameter values are string, not number.
          // $FlowFixMe: https://github.com/mozilla/addons-frontend/issues/5737
          includeAddonId: location.query.include_addon_id,
          userId: currentUserId,
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
          userId: collection.authorId,
        }),
      );
    }
  };

  onTextInput: (event: InputOrTextAreaEvent) => void = (
    event: InputOrTextAreaEvent,
  ) => {
    event.preventDefault();
    const { name, value } = event.target;
    const { creating } = this.props;

    if (typeof value === 'undefined') {
      return;
    }

    const trimmedValue = value.trim();

    if (creating && name === 'name' && !this.state.customSlug) {
      this.setState({
        slug: trimmedValue
          .split(/[^A-Za-z0-9]/)
          .filter((s) => s !== '')
          .join('-')
          .substring(0, SLUG_MAX_LENGTH),
        name: value,
      });
    } else if (creating && name === 'slug' && trimmedValue !== '') {
      this.setState({
        customSlug: true,
        slug: value,
      });
    } else {
      // Flow complains because it cannot infer `name` since Flow 0.113.0, see:
      // https://medium.com/flow-type/spreads-common-errors-fixes-9701012e9d58
      // $FlowIgnore
      this.setState({ [name]: value });
    }
  };

  render(): React.Node {
    const {
      collection,
      creating,
      currentUserId,
      errorHandler,
      i18n,
      isCollectionBeingModified,
      siteLang,
    } = this.props;
    const { description, name, slug } = this.state;

    const collectionUrlPrefix = oneLineTrim`${config.get(
      'apiHost',
    )}/${siteLang}/firefox/collections/
       ${(collection && collection.authorId) || currentUserId}/`;

    const formIsUnchanged =
      collection &&
      collection.name === name &&
      collection.slug === slug &&
      (collection.description === description ||
        (collection.description === null && !description));
    const formIsDisabled =
      (!collection && !creating) || isCollectionBeingModified;
    const isNameBlank = !(name && name.trim().length);
    const isSlugBlank = !(slug && slug.trim().length);
    const isSubmitDisabled =
      formIsDisabled || formIsUnchanged || isNameBlank || isSlugBlank;
    const buttonText = creating
      ? i18n.t('Create collection')
      : i18n.t('Save changes');

    return (
      <form className="CollectionManager" onSubmit={this.onSubmit}>
        {errorHandler.renderErrorIfPresent()}
        <label
          className="CollectionManager-collectionName"
          htmlFor="collectionName"
        >
          {i18n.t('Collection name')}
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

        <label htmlFor="collectionDescription">{i18n.t('Description')}</label>
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

        <label htmlFor="collectionSlug">{i18n.t('Custom URL')}</label>
        <div className="CollectionManager-slug">
          <div
            id="collectionUrlPrefix"
            title={collectionUrlPrefix}
            className="CollectionManager-slug-url-hint"
          >
            <div className="CollectionManager-slug-url-prefix">
              {/*
                 &lrm; (left-to-right mark) is an invisible control
                 character. It's added to prevent the bi-directional
                 trailing slash character (in the URL) from getting
                 reversed when using direction: rtl.
                */}
              {collectionUrlPrefix}
              &lrm;
            </div>
          </div>
          <input
            onChange={this.onTextInput}
            id="collectionSlug"
            maxLength={SLUG_MAX_LENGTH}
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
            {i18n.t('Cancel')}
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

export const extractId = (ownProps: Props): string => {
  const { collection } = ownProps;
  return `collection-${collection ? collection.slug : ''}`;
};

const mapStateToProps = (state: AppState): PropsFromState => {
  const currentUser = getCurrentUser(state.users);

  return {
    clientApp: state.api.clientApp,
    currentUserId: currentUser && currentUser.id,
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
