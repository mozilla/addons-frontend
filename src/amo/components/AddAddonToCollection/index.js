/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  addAddonToCollection,
  expandCollections,
  fetchUserCollections,
  collectionName,
} from 'amo/reducers/collections';
import { getCurrentUser } from 'amo/reducers/users';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import Card from 'amo/components/Card';
import Select from 'amo/components/Select';
import Notice from 'amo/components/Notice';
import type { CollectionType } from 'amo/reducers/collections';
import type { UserId } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type {
  TypedElementEvent,
  HTMLElementEventHandlerWithTarget,
} from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterHistoryType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
|};

type PropsFromState = {|
  // These are all user collections that the current add-on is a part of.
  addonInCollections: Array<CollectionType> | null,
  clientApp: string,
  currentUserId: UserId | null,
  lang: string,
  loadingAddonsInCollections: boolean,
  loadingUserCollections: boolean,
  // These are all collections belonging to the user.
  userCollections: Array<CollectionType> | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  history: ReactRouterHistoryType,
|};

type OnSelectOptionType = () => void;

type SelectData = {|
  actionOptions: Array<Object>,
  collectionOptions: Array<Object>,
  disabled: boolean,
|};

export class AddAddonToCollectionBase extends React.Component<InternalProps> {
  optionSelectHandlers: { [key: string]: OnSelectOptionType };

  constructor(props: InternalProps) {
    super(props);

    this.optionSelectHandlers = {};
  }

  componentDidMount() {
    // This runs as componentDidMount() to only load data client side,
    // not server side. By skipping server side rendering, no extra API
    // requests will be made on the server.
    this.loadDataIfNeeded();
  }

  componentDidUpdate() {
    this.loadDataIfNeeded();
  }

  loadDataIfNeeded() {
    const {
      currentUserId,
      dispatch,
      errorHandler,
      loadingUserCollections,
      userCollections,
    } = this.props;

    if (errorHandler.hasError()) {
      // Abort loading data so that the error can be rendered.
      return;
    }

    if (currentUserId && !loadingUserCollections && !userCollections) {
      dispatch(
        fetchUserCollections({
          errorHandlerId: errorHandler.id,
          userId: currentUserId,
        }),
      );
    }
  }

  onSelectOption: HTMLElementEventHandlerWithTarget<HTMLSelectElement> = (
    event: TypedElementEvent<HTMLSelectElement>,
  ) => {
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
    const { addon, currentUserId, dispatch, errorHandler } = this.props;
    invariant(
      addon,
      'Cannot add to collection because no add-on has been loaded',
    );
    invariant(
      currentUserId,
      'Cannot add to collection because you are not signed in',
    );

    dispatch(
      addAddonToCollection({
        addonId: addon.id,
        collectionId: collection.id,
        slug: collection.slug,
        errorHandlerId: errorHandler.id,
        userId: currentUserId,
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
  }): React.Node {
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
      addon,
      clientApp,
      i18n,
      lang,
      loadingAddonsInCollections,
      loadingUserCollections,
      history,
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
          invariant(addon, 'addon is required');
          history.push(
            `/${lang}/${clientApp}/collections/add/?include_addon_id=${addon.id}`,
          );
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
              text: collectionName({ name: collection.name, i18n }),
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

  render(): React.Node {
    const { errorHandler, i18n, addonInCollections } = this.props;
    const { actionOptions, collectionOptions, disabled } = this.getSelectData();

    let addedNotices: Array<React.Node> = [];
    if (addonInCollections) {
      addedNotices = addonInCollections.map((collection) => {
        const notice = i18n.sprintf(
          i18n.gettext('Added to %(collectionName)s'),
          { collectionName: collectionName({ name: collection.name, i18n }) },
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

    // L10n: This is a header for a list meaning Add to [some collection name]
    const collectionOptLabel = i18n.gettext('Add to…');

    return (
      <Card
        className="AddAddonToCollection"
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

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  const { collections, users } = state;
  const currentUser = getCurrentUser(users);
  const currentUserId = currentUser && currentUser.id;

  let userCollections;
  let addonInCollections;

  if (currentUserId) {
    userCollections = collections.userCollections[currentUserId];
    const { addon } = ownProps;
    if (addon) {
      addonInCollections =
        collections.addonInCollections[currentUserId] &&
        collections.addonInCollections[currentUserId][addon.id];
    }
  }
  return {
    addonInCollections: expandCollections(collections, addonInCollections),
    clientApp: state.api.clientApp,
    currentUserId,
    lang: state.api.lang,
    loadingAddonsInCollections: addonInCollections
      ? addonInCollections.loading
      : false,
    loadingUserCollections: userCollections ? userCollections.loading : false,
    userCollections: expandCollections(collections, userCollections),
  };
};

export const extractId = (ownProps: InternalProps): string => {
  const { addon, currentUserId } = ownProps;

  return `${addon ? addon.id : ''}-${currentUserId || ''}`;
};

const AddAddonToCollection: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddAddonToCollectionBase);

export default AddAddonToCollection;
