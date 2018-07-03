/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { normalizeFileNameId } from 'core/utils';

export const SET_UI_STATE = 'SET_UI_STATE';

type UIStateType = {
  [id: string]: Object,
};

const initialState = {};

type SetUIStateParams = {|
  id: string,
  change: Object,
|};

type SetUIStateAction = {|
  payload: SetUIStateParams,
  type: typeof SET_UI_STATE,
|};

export const setUIState = ({
  change,
  id,
}: SetUIStateParams): SetUIStateAction => {
  invariant(change, 'change cannot be undefined');
  invariant(id, 'id cannot be undefined');
  // TODO: maybe we need setInitialUIState() that resets the object rather than changing it.
  // TODO: maybe disallow and value of `change` to be an object?
  // I'm thinking of nested objects which redux may not be able to
  // handle in mapStateToProps

  return { type: SET_UI_STATE, payload: { change, id } };
};

export const generateId = ({
  fileName,
  id,
}: {|
  fileName: string,
  id: string,
|}) => {
  invariant(fileName, 'fileName is required');
  invariant(typeof id === 'string', 'id must be a string');

  return `${normalizeFileNameId(fileName)}-${id}`;
};

export const withUIState = ({
  fileName,
  extractId,
  defaultState = {},
}: {|
  fileName: string,
  extractId: (props: Object) => string,
  defaultState?: Object,
|}): ((React.ComponentType<any>) => React.ComponentType<any>) => {
  invariant(fileName, 'fileName is required');
  invariant(extractId, 'extractId is required');
  invariant(defaultState, 'defaultState is required');

  const mapStateToProps = (
    state: {| uiState: UIStateType |},
    props: Object,
  ) => {
    const uiStateID = generateId({ fileName, id: extractId(props) });
    const uiState = state.uiState[uiStateID] || defaultState;
    return {
      uiState,
      uiStateID,
    };
  };

  const mergeProps = (stateProps, dispatchProps, ownProps) => {
    const { dispatch } = dispatchProps;
    return {
      ...ownProps,
      ...stateProps,
      ...dispatchProps,
      setUIState: (change: Object) => {
        dispatch(setUIState({ id: stateProps.uiStateID, change }));
      },
      // This is just for testing to simulate the props you'll
      // get after a Redux action is dispatched.
      // Using shallowUntilTarget() and root.update() won't
      // actually update all of the HOC wrapped components
      // ... I guess?
      simulateUIStateProps: ({ store }: {| store: Object |}) => {
        const stateProps = mapStateToProps(store.getState(), ownProps);
        return mergeProps(stateProps, { dispatch: store.dispatch }, ownProps);
      },
    };
  };

  return (WrappedComponent) => {
    return compose(
      connect(
        mapStateToProps,
        undefined,
        mergeProps,
      ),
    )(WrappedComponent);
  };
};

type UIStateActions = SetUIStateAction;

export default function uiState(
  state: UIStateType = initialState,
  action: UIStateActions,
) {
  switch (action.type) {
    case SET_UI_STATE: {
      const { change, id } = action.payload;

      return {
        ...state,
        [id]: {
          ...state[id],
          ...change,
        },
      };
    }
    default:
      return state;
  }
}
