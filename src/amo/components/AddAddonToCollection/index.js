/* @flow */
/* global window */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  addAddonToCollection,
  expandCollections,
  fetchUserCollections,
} from 'amo/reducers/collections';
import { getCurrentUser } from 'amo/reducers/users';
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
import type { CollectionType } from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { ElementEvent } from 'core/types/dom';

import './styles.scss';

type Props = {|
  _window: typeof window | Object,
  addon: AddonType | null,
  // These are all user collections that the current add-on is a part of.
  addonInCollections: Array<CollectionType> | null,
  className?: string,
  currentUsername: string | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  loadingAddonsInCollections: boolean,
  loadingUserCollections: boolean,
  // These are all collections belonging to the user.
  userCollections: Array<CollectionType> | null,
|};

type OnSelectOptionType = () => void;

type SelectData = {|
  actionOptions: Array<Object>,
  collectionOptions: Array<Object>,
  disabled: boolean,
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
      currentUsername,
      dispatch,
      errorHandler,
      loadingUserCollections,
      userCollections,
    } = combinedProps;

    if (errorHandler.hasError()) {
      // Abort loading data so that the error can be rendered.
      return;
    }

    if (currentUsername && !loadingUserCollections && !userCollections) {
      dispatch(
        fetchUserCollections({
          errorHandlerId: errorHandler.id,
          username: currentUsername,
        }),
      );
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
  };

  addToCollection(collection: CollectionType) {
    const { addon, currentUsername, dispatch, errorHandler } = this.props;
    if (!addon) {
      throw new Error(
        'Cannot add to collection because no add-on has been loaded',
      );
    }
    if (!currentUsername) {
      throw new Error('Cannot add to collection because you are not signed in');
    }

    dispatch(
      addAddonToCollection({
        addonId: addon.id,
        collectionId: collection.id,
        slug: collection.slug,
        errorHandlerId: errorHandler.id,
        username: currentUsername,
      }),
    );
  }

  createOption({
    text,
    key,
    onSelect,
  }: {
    // eslint-disable-next-line react/no-unused-prop-types
    text: string,
    // eslint-disable-next-line react/no-unused-prop-types
    key: string,
    // eslint-disable-next-line react/no-unused-prop-types
    onSelect?: OnSelectOptionType,
  }) {
    if (onSelect) {
      this.optionSelectHandlers[key] = onSelect;
    }
    return (
      <option className="AddAddonToCollection-option" key={key} value={key}>
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
        this.createOption({ text: progressMessage, key: 'default' }),
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
      }),
    );

    actionOptions.push(
      this.createOption({
        text: i18n.gettext('Create new collection'),
        key: 'create-new-collection',
        onSelect: () => {
          // TODO: show create collection overlay when it's implemented.
          // See
          // https://github.com/mozilla/addons-frontend/issues/4003
          // https://github.com/mozilla/addons-frontend/issues/3993
          _window.location = '/collections/add';
        },
      }),
    );

    if (userCollections && userCollections.length) {
      userCollections
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((collection) => {
          // Make an option for adding the add-on to this collection.
          // If the user selects a collection that the add-on already
          // belongs to, they will see an error.
          collectionOptions.push(
            this.createOption({
              text: collection.name,
              key: `collection-${collection.id}`,
              onSelect: () => {
                this.addToCollection(collection);
              },
            }),
          );
        });
    }

    return { actionOptions, collectionOptions, disabled: false };
  }

  render() {
    const { className, errorHandler, i18n, addonInCollections } = this.props;
    const { actionOptions, collectionOptions, disabled } = this.getSelectData();

    let addedNotices = [];
    if (addonInCollections) {
      addedNotices = addonInCollections.map((collection) => {
        const notice = i18n.sprintf(
          i18n.gettext('Added to %(collectionName)s'),
          { collectionName: collection.name },
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
            <optgroup label={collectionOptLabel}>{collectionOptions}</optgroup>
          ) : null}
        </Select>
      </Card>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { collections, users } = state;
  const currentUser = getCurrentUser(users);
  const currentUsername = currentUser && currentUser.username;

  let userCollections;
  let addonInCollections;

  if (currentUsername) {
    userCollections = collections.userCollections[currentUsername];
    const { addon } = ownProps;
    if (addon) {
      addonInCollections =
        collections.addonInCollections[currentUsername] &&
        collections.addonInCollections[currentUsername][addon.id];
    }
  }
  return {
    addonInCollections: expandCollections(collections, addonInCollections),
    currentUsername,
    loadingAddonsInCollections: addonInCollections
      ? addonInCollections.loading
      : false,
    loadingUserCollections: userCollections ? userCollections.loading : false,
    userCollections: expandCollections(collections, userCollections),
  };
};

export const extractId = (ownProps: Props) => {
  const { addon, currentUsername } = ownProps;
  return `${addon ? addon.id : ''}-${currentUsername || ''}`;
};

const AddAddonToCollection: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddAddonToCollectionBase);

export default AddAddonToCollection;
