/* @flow */
/* global window */
/* eslint-disable react/sort-comp */
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
import Select from 'ui/components/Select';
import type { AddonType } from 'core/types/addons';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type {
  CollectionsState, CollectionType,
} from 'amo/reducers/collections';
import type { UserStateType } from 'core/reducers/user';
import type { ElementEvent } from 'core/types/dom';

import './styles.scss';


type Props = {|
  addon: AddonType | null,
  className?: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  loadingUserCollections: boolean,
  siteUserId: number | null,
  userCollections: Array<CollectionType> | null,
  _window: typeof window | Object,
|};

type OnSelectOptionType = () => void;

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
    const { errorHandler, dispatch } = this.props;
    const allProps = { ...this.props, ...nextProps };

    if (
      allProps.siteUserId &&
      !allProps.loadingUserCollections &&
      !allProps.userCollections
    ) {
      dispatch(fetchUserCollections({
        errorHandlerId: errorHandler.id, userId: allProps.siteUserId,
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

  render() {
    const { _window, className, i18n, userCollections } = this.props;
    // TODO: render errors

    const options = [
      this.createOption({
        text: i18n.gettext('Add to collection'),
        key: 'default',
      }),
    ];

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

    if (userCollections) {
      userCollections.forEach((collection) => {
        // TODO: set <Select> value to collection key when added
        options.push(this.createOption({
          text: collection.name,
          key: `collection-${collection.id}`,
          onSelect: () => {
            this.addToCollection(collection);
          },
        }));
      });
    }

    return (
      <div className={makeClassName('AddAddonToCollection', className)}>
        <Select
          onChange={this.onSelectOption}
          className="AddAddonToCollection-select"
        >
          {options}
        </Select>
      </div>
    );
  }
}

export const mapStateToProps = (
  state: {| collections: CollectionsState, user: UserStateType |}
) => {
  const collections = state.collections;
  // TODO: merge with user patch and do getCurrentUser(state).id
  const siteUserId = state.user.id;
  let userCollections;
  if (siteUserId) {
    userCollections = collections.userCollections[siteUserId];
  }
  return {
    loadingUserCollections:
      userCollections ? userCollections.loading : false,
    userCollections: userCollections && userCollections.collections ?
      // TODO: use select function so it can throw errors for missing.
      userCollections.collections.map((id) => collections.byId[id]) :
      null,
    siteUserId,
  };
};

const extractId = (ownProps: Props) => {
  const { addon, siteUserId } = ownProps;
  // TODO: add tests
  return `${addon ? addon.id : ''}-${siteUserId || ''}`;
};

export default compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddAddonToCollectionBase);
