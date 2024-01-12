/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { compose } from 'redux';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import { addAddonToCollection } from 'amo/reducers/collections';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import withUIState from 'amo/withUIState';
import Card from 'amo/components/Card';
import Notice from 'amo/components/Notice';
import type { SuggestionType } from 'amo/reducers/autocomplete';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

export const MESSAGE_RESET_TIME = 5000;
const MESSAGE_FADEOUT_TIME = 450;

export const addonAddedAction: 'added' = 'added';
export const addonRemovedAction: 'removed' = 'removed';

type UIStateType = {|
  addonAction: typeof addonAddedAction | typeof addonRemovedAction | null,
|};

const initialUIState: UIStateType = {
  addonAction: null,
};

export type Props = {|
  collection: CollectionType | null,
  filters: CollectionFilters,
|};

export type DefaultProps = {|
  clearTimeout: (TimeoutID) => void,
  setTimeout: (Function, delay?: number) => TimeoutID | void,
|};

export type PropsFromState = {|
  hasAddonBeenAdded: boolean,
  hasAddonBeenRemoved: boolean,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  jed: I18nType,
  setUIState: (state: $Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

export class CollectionAddAddonBase extends React.Component<InternalProps> {
  timeout: TimeoutID | void;

  static defaultProps: DefaultProps = {
    setTimeout:
      typeof window !== 'undefined' ? window.setTimeout.bind(window) : () => {},
    clearTimeout:
      typeof window !== 'undefined'
        ? window.clearTimeout.bind(window)
        : () => {},
  };

  componentDidUpdate(prevProps: InternalProps) {
    const { hasAddonBeenAdded, hasAddonBeenRemoved } = prevProps;
    const {
      errorHandler,
      hasAddonBeenAdded: hasAddonBeenAddedNew,
      hasAddonBeenRemoved: hasAddonBeenRemovedNew,
      setTimeout,
      setUIState,
    } = this.props;

    const addStatusChanged = hasAddonBeenAdded !== hasAddonBeenAddedNew;
    const removeStatusChanged = hasAddonBeenRemoved !== hasAddonBeenRemovedNew;

    if (addStatusChanged) {
      setUIState({
        addonAction: hasAddonBeenAddedNew ? addonAddedAction : null,
      });
    }

    if (removeStatusChanged) {
      setUIState({
        addonAction: hasAddonBeenRemovedNew ? addonRemovedAction : null,
      });
    }

    if (
      (addStatusChanged || removeStatusChanged) &&
      (hasAddonBeenAddedNew || hasAddonBeenRemovedNew)
    ) {
      errorHandler.clear();
      this.timeout = setTimeout(this.resetMessages, MESSAGE_RESET_TIME);
    }
  }

  componentWillUnmount() {
    this.resetMessages();
  }

  resetMessages: () => void = () => {
    this.props.setUIState({
      addonAction: null,
    });
    if (this.timeout) {
      this.props.clearTimeout(this.timeout);
    }
  };

  onAddonSelected: (suggestion: SuggestionType) => void = (
    suggestion: SuggestionType,
  ) => {
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
        userId: collection.authorId,
      }),
    );
    this.resetMessages();
  };

  render(): React.Node {
    const { collection, errorHandler, jed, uiState } = this.props;

    const { addonAction } = uiState;
    const addonAdded = addonAction === addonAddedAction;

    return (
      <Card className="CollectionAddAddon">
        {errorHandler.hasError() ? (
          errorHandler.renderError()
        ) : (
          <TransitionGroup className="CollectionAddAddon-noticePlaceholder">
            {addonAction && (
              <CSSTransition
                classNames="CollectionAddAddon-noticePlaceholder-transition"
                timeout={MESSAGE_FADEOUT_TIME}
              >
                <Notice type={addonAdded ? 'success' : 'generic'}>
                  {addonAdded
                    ? jed.gettext('Added to collection')
                    : jed.gettext('Removed from collection')}
                </Notice>
              </CSSTransition>
            )}
          </TransitionGroup>
        )}

        <AutoSearchInput
          inputName="collection-addon-query"
          inputPlaceholder={jed.gettext(
            'Find an add-on to include in this collection',
          )}
          onSuggestionSelected={this.onAddonSelected}
          selectSuggestionText={jed.gettext('Add to collection')}
          key={collection ? collection.id : ''}
        />
      </Card>
    );
  }
}

export const extractId = (props: Props): string => {
  const { collection } = props;
  return `collection${collection ? collection.id : ''}`;
};

export const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    hasAddonBeenAdded: state.collections.hasAddonBeenAdded,
    hasAddonBeenRemoved: state.collections.hasAddonBeenRemoved,
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
