/* @flow */
/* global window */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  addAddonToCollection, fetchUserAddonCollections, fetchUserCollections,
} from 'amo/reducers/collections';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Select from 'ui/components/Select';
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
  loadingUserAddonCollections: boolean,
  loadingUserCollections: boolean,
  siteUserId: number | null,
  // These are all user collections that the current add-on is a part of.
  userAddonCollections: Array<CollectionType> | null,
  // These are all collections belonging to the user.
  userCollections: Array<CollectionType> | null,
  _window: typeof window | Object,
|};

type OnSelectOptionType = () => void;

type SelectData = {|
  value: string | void, options: Array<Object>, disabled: boolean,
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
    // not server side.
    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: Props) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps?: Props) {
    const allProps = { ...this.props, ...nextProps };
    const {
      addon,
      dispatch,
      errorHandler,
      loadingUserAddonCollections,
      loadingUserCollections,
      userAddonCollections,
      userCollections,
      siteUserId,
    } = allProps;

    if (siteUserId) {
      if (!loadingUserCollections && !userCollections) {
        dispatch(fetchUserCollections({
          errorHandlerId: errorHandler.id, userId: siteUserId,
        }));
      }

      if (
        addon && !loadingUserAddonCollections && !userAddonCollections
      ) {
        dispatch(fetchUserAddonCollections({
          addonId: addon.id,
          errorHandlerId: errorHandler.id,
          userId: siteUserId,
        }));
      }
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
      collectionSlug: collection.slug,
      errorHandlerId: errorHandler.id,
      userId: siteUserId,
    }));
  }

  createOption(
    {
      text, key, onSelect,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      text: string, key: string, onSelect?: OnSelectOptionType,
    }
  ) {
    if (onSelect) {
      this.optionSelectHandlers[key] = onSelect;
    }
    return (
      <option
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
      loadingUserAddonCollections,
      loadingUserCollections,
      userAddonCollections,
      userCollections,
    } = this.props;

    const options = [];

    // TODO: show loading when adding add-on to a collection.
    if (loadingUserAddonCollections || loadingUserCollections) {
      options.push(
        this.createOption({
          text: i18n.gettext('Loading...'), key: 'default',
        })
      );

      return { value: undefined, options, disabled: true };
    }

    options.push(
      this.createOption({
        text: i18n.gettext('Add to collection'), key: 'default',
      })
    );

    options.push(this.createOption({
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

    let selectedKey;
    if (userAddonCollections && userAddonCollections.length) {
      selectedKey = userAddonCollections.map((c) => c.id).join(':');
      // Make an option indicating which collections this add-on is
      // already a part of.
      options.push(this.createOption({
        text: userAddonCollections.map((c) => c.name).sort().join(', '),
        key: selectedKey,
      }));
    }

    if (userCollections && userCollections.length) {
      // Make a map of collection IDs that the add-on already belongs to.
      const alreadyAdded = new Map(
        (userAddonCollections || []).map(
          (collection) => [collection.id, true]
        )
      );
      userCollections.forEach((collection) => {
        if (alreadyAdded.get(collection.id)) {
          return;
        }
        // Make an option for adding the add-on to this collection.
        options.push(this.createOption({
          text: collection.name,
          key: `collection-${collection.id}`,
          onSelect: () => {
            this.addToCollection(collection);
          },
        }));
      });
    }

    return { options, value: selectedKey, disabled: false };
  }

  render() {
    const { className, errorHandler } = this.props;
    const { options, disabled, value } = this.getSelectData();

    return (
      <div className={makeClassName('AddAddonToCollection', className)}>
        {errorHandler.renderErrorIfPresent()}
        <Select
          disabled={disabled}
          value={value}
          onChange={this.onSelectOption}
          className="AddAddonToCollection-select"
        >
          {options}
        </Select>
      </div>
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
  const collections = state.collections;
  const siteUserId = state.users.currentUserID;

  let userCollections;
  let userAddonCollections;

  if (siteUserId) {
    userCollections = collections.userCollections[siteUserId];
    const { addon } = ownProps;
    if (addon) {
      userAddonCollections =
        collections.userAddonCollections[siteUserId] &&
        collections.userAddonCollections[siteUserId][addon.id];
    }
  }
  return {
    loadingUserAddonCollections:
      userAddonCollections ? userAddonCollections.loading : false,
    loadingUserCollections:
      userCollections ? userCollections.loading : false,
    siteUserId,
    userAddonCollections:
      expandCollections(collections, userAddonCollections),
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
