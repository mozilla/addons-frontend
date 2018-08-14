/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { compose } from 'redux';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import { addAddonToCollection } from 'amo/reducers/collections';
import { getCurrentUser } from 'amo/reducers/users';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import withUIState from 'core/withUIState';
import Notice from 'ui/components/Notice';
import type { SuggestionType } from 'amo/components/AutoSearchInput';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';

export const MESSAGE_RESET_TIME = 5000;
const MESSAGE_FADEOUT_TIME = 450;

type UIStateType = {|
  addonWasAdded: boolean,
|};

const initialUIState: UIStateType = {
  addonWasAdded: false,
};

export type Props = {|
  collection: CollectionType | null,
  filters: CollectionFilters,
|};

type InternalProps = {|
  ...Props,
  clearTimeout: Function,
  currentUsername: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  hasAddonBeenAdded: boolean,
  i18n: I18nType,
  setTimeout: Function,
  setUIState: (state: $Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

export class CollectionAddAddonBase extends React.Component<InternalProps> {
  timeout: TimeoutID;

  static defaultProps = {
    setTimeout:
      typeof window !== 'undefined' ? window.setTimeout.bind(window) : () => {},
    clearTimeout:
      typeof window !== 'undefined'
        ? window.clearTimeout.bind(window)
        : () => {},
  };

  componentWillReceiveProps(props: InternalProps) {
    const { hasAddonBeenAdded: hasAddonBeenAddedNew } = props;
    const { hasAddonBeenAdded } = this.props;
    if (hasAddonBeenAdded !== hasAddonBeenAddedNew) {
      this.props.setUIState({
        addonWasAdded: props.hasAddonBeenAdded,
      });
    }

    if (hasAddonBeenAddedNew && hasAddonBeenAddedNew !== hasAddonBeenAdded) {
      this.timeout = this.props.setTimeout(
        this.resetMessageStatus,
        MESSAGE_RESET_TIME,
      );
    }
  }

  componentWillUnmount() {
    if (this.timeout) {
      this.props.clearTimeout(this.timeout);
    }
  }

  onAddonSelected = (suggestion: SuggestionType) => {
    const { collection, dispatch, errorHandler, filters } = this.props;
    const { addonId } = suggestion;

    invariant(addonId, 'addonId is required');
    invariant(collection, 'collection is required');

    dispatch(
      addAddonToCollection({
        addonId,
        collectionId: collection.id,
        editing: true,
        errorHandlerId: errorHandler.id,
        filters,
        slug: collection.slug,
        username: collection.authorUsername,
      }),
    );
    this.props.setUIState({ addonWasAdded: false });
  };

  resetMessageStatus = () => {
    this.props.setUIState({
      addonWasAdded: false,
    });
  };

  render() {
    const { errorHandler, i18n, uiState } = this.props;

    return (
      <div className="CollectionAddAddon">
        {errorHandler.hasError() ? (
          errorHandler.renderError()
        ) : (
          <TransitionGroup className="CollectionAddAddon-noticePlaceholder">
            {uiState.addonWasAdded && (
              <CSSTransition
                classNames="CollectionAddAddon-noticePlaceholder-transition"
                timeout={MESSAGE_FADEOUT_TIME}
              >
                <Notice type="success">
                  {i18n.gettext('Added to collection')}
                </Notice>
              </CSSTransition>
            )}
          </TransitionGroup>
        )}

        <AutoSearchInput
          inputName="collection-addon-query"
          inputPlaceholder={i18n.gettext(
            'Find an add-on to include in this collection',
          )}
          onSearch={() => {}}
          onSuggestionSelected={this.onAddonSelected}
          selectSuggestionText={i18n.gettext('Add to collection')}
        />
      </div>
    );
  }
}

export const extractId = (props: Props) => {
  const { collection } = props;
  return `collection${collection ? collection.id : ''}`;
};

export const mapStateToProps = (state: AppState) => {
  const currentUser = getCurrentUser(state.users);

  return {
    currentUsername: currentUser && currentUser.username,
    hasAddonBeenAdded: state.collections.hasAddonBeenAdded,
  };
};

const CollectionAddAddon: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
  }),
)(CollectionAddAddonBase);

export default CollectionAddAddon;
