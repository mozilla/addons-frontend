/* @flow */
/* global window */
/* eslint-disable react/sort-comp, react/no-unused-prop-types */
import makeClassName from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  addAddonToCollection, fetchUserCollections,
} from 'amo/reducers/collections';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Card from 'ui/components/Card';
import Select from 'ui/components/Select';
import Notice from 'ui/components/Notice';
import type { AddonType } from 'core/types/addons';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type {
  CollectionId, CollectionsState, CollectionType,
} from 'amo/reducers/collections';
import type { UsersStateType } from 'amo/reducers/users';
import type { ElementEvent } from 'core/types/dom';

import './styles.scss';


type Props = {|
  addon: AddonType | null,
  className?: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  loadingAddonsInCollections: boolean,
  loadingUserCollections: boolean,
  siteUserId: number | null,
  // These are all user collections that the current add-on is a part of.
  addonInCollections: Array<CollectionType> | null,
  // These are all collections belonging to the user.
  userCollections: Array<CollectionType> | null,
  _window: typeof window | Object,
|};

type OnSelectOptionType = () => void;

type SelectData = {|
  actionOptions: Array<Object>,
  collectionOptions: Array<Object>,
  disabled: boolean,
|};

type CreateOptionParams = {|
  disabled?: boolean,
  key: string,
  onSelect?: OnSelectOptionType,
  text: string,
|};

export class AddAddonToCollectionBase extends React.Component<Props> {
  optionSelectHandlers: { [key: string]: OnSelectOptionType };

  static defaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

  constructor(props: Props) {
    super(props);
    this.optionSelectHandlers = {};
  }

  componentDidMount() {
    // This runs as componentDidMount() to only load data client side,
    // not server side. By skipping server side rendering, no extra API
    // requests will be made on the server.
    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: Props) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps?: Props) {
    const combinedProps = { ...this.props, ...nextProps };
    const {
      dispatch,
      errorHandler,
      loadingUserCollections,
      userCollections,
      siteUserId,
    } = combinedProps;

    if (errorHandler.hasError()) {
      // Abort loading data so that the error can be rendered.
      return;
    }

    if (siteUserId && !loadingUserCollections && !userCollections) {
      dispatch(fetchUserCollections({
        errorHandlerId: errorHandler.id, userId: siteUserId,
      }));
    }
  }

  onSelectOption = (event: ElementEvent<HTMLSelectElement>) => {
    event.preventDefault();
    const key = event.target.value;
    const handleOption = this.optionSelectHandlers[key];
    if (handleOption) {
      handleOption();
    } else {
      log.warn(`No handler for option: "${key}"`);
    }
  }

  addToCollection(collection: CollectionType) {
    const { addon, errorHandler, dispatch, siteUserId } = this.props;
    if (!addon) {
      throw new Error(
        'Cannot add to collection because no add-on has been loaded');
    }
    if (!siteUserId) {
      throw new Error(
        'Cannot add to collection because you are not signed in');
    }

    dispatch(addAddonToCollection({
      addonId: addon.id,
      collectionId: collection.id,
      collectionSlug: collection.slug,
      errorHandlerId: errorHandler.id,
      userId: siteUserId,
    }));
  }

  createOption({
    text, key, onSelect, disabled = false,
  }: CreateOptionParams) {
    if (onSelect) {
      this.optionSelectHandlers[key] = onSelect;
    }
    return (
      <option
        disabled={disabled}
        className="AddAddonToCollection-option"
        key={key}
        value={key}
      >
        {text}
      </option>
    );
  }

  getSelectData(): SelectData {
    const {
      _window,
      i18n,
      loadingAddonsInCollections,
      loadingUserCollections,
      userCollections,
    } = this.props;

    const actionOptions = [];
    const collectionOptions = [];
    let progressMessage;

    if (loadingUserCollections) {
      progressMessage = i18n.gettext('Loading…');
    } else if (loadingAddonsInCollections) {
      progressMessage = i18n.gettext('Adding…');
    }
    if (progressMessage) {
      // Create a disabled select box with a single option.
      actionOptions.push(
        this.createOption({ text: progressMessage, key: 'default' })
      );
      return {
        disabled: true,
        actionOptions,
        collectionOptions,
      };
    }

    actionOptions.push(
      this.createOption({
        text: i18n.gettext('Select a collection…'),
        key: 'default',
        disabled: true,
      })
    );

    actionOptions.push(this.createOption({
      text: i18n.gettext('Create new collection'),
      key: 'create-new-collection',
      onSelect: () => {
        // TODO: show create collection overlay when it's implemented.
        // See
        // https://github.com/mozilla/addons-frontend/issues/4003
        // https://github.com/mozilla/addons-frontend/issues/3993
        _window.location = '/collections/add';
      },
    }));

    if (userCollections && userCollections.length) {
      userCollections.forEach((collection) => {
        // Make an option for adding the add-on to this collection.
        // If the user selects a collection that the add-on already
        // belongs to, they will see an error.
        collectionOptions.push(this.createOption({
          text: collection.name,
          key: `collection-${collection.id}`,
          onSelect: () => {
            this.addToCollection(collection);
          },
        }));
      });
    }

    return { actionOptions, collectionOptions, disabled: false };
  }

  render() {
    const {
      className, errorHandler, i18n, addonInCollections,
    } = this.props;
    const {
      actionOptions, collectionOptions, disabled,
    } = this.getSelectData();

    let addedNotices = [];
    if (addonInCollections) {
      addedNotices = addonInCollections.map((collection) => {
        const notice = i18n.sprintf(
          i18n.gettext('Added to %(collectionName)s'),
          { collectionName: collection.name }
        );
        return (
          <Notice
            type="success"
            key={collection.id}
            className="AddAddonToCollection-added"
          >
            {notice}
          </Notice>
        );
      });
    }

    // translators: This is a header for a list meaning Add to [some collection name]
    const collectionOptLabel = i18n.gettext('Add to…');

    return (
      <Card
        className={makeClassName('AddAddonToCollection', className)}
        header={i18n.gettext('Add to collection')}
      >
        {errorHandler.renderErrorIfPresent()}
        {addedNotices}
        <Select
          disabled={disabled}
          onChange={this.onSelectOption}
          className="AddAddonToCollection-select"
        >
          {actionOptions}
          {collectionOptions.length ? (
            <optgroup label={collectionOptLabel}>
              {collectionOptions}
            </optgroup>
          ) : null}
        </Select>
      </Card>
    );
  }
}

const expandCollections = (
  collections: CollectionsState,
  meta?: { collections: Array<CollectionId> | null }
): Array<CollectionType> | null => {
  return meta && meta.collections ?
    meta.collections.map((id) => collections.byId[id]) :
    null;
};

export const mapStateToProps = (
  state: {| collections: CollectionsState, users: UsersStateType |},
  ownProps: Props
) => {
  const { collections } = state;
  const siteUserId = state.users.currentUserID;

  let userCollections;
  let addonInCollections;

  if (siteUserId) {
    userCollections = collections.userCollections[siteUserId];
    const { addon } = ownProps;
    if (addon) {
      addonInCollections =
        collections.addonInCollections[siteUserId] &&
        collections.addonInCollections[siteUserId][addon.id];
    }
  }
  return {
    loadingAddonsInCollections:
      addonInCollections ? addonInCollections.loading : false,
    loadingUserCollections:
      userCollections ? userCollections.loading : false,
    siteUserId,
    addonInCollections:
      expandCollections(collections, addonInCollections),
    userCollections:
      expandCollections(collections, userCollections),
  };
};

export const extractId = (ownProps: Props) => {
  const { addon, siteUserId } = ownProps;
  return `${addon ? addon.id : ''}-${siteUserId || ''}`;
};

export default compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddAddonToCollectionBase);
