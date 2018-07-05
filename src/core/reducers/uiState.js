/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { normalizeFileNameId } from 'core/utils';

export const SET_UI_STATE = 'SET_UI_STATE';

type ExtractIdType = (props: Object) => string;

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

export const createUIStateMapper = ({
  initialState,
  extractId,
  fileName,
  uiStateID,
}: {|
  initialState: Object,
  extractId?: ExtractIdType,
  fileName?: string,
  uiStateID?: string,
|}) => {
  const mapStateToProps = (
    state: {| uiState: UIStateType |},
    props: Object,
  ) => {
    let computedUIStateID;
    if (uiStateID) {
      computedUIStateID = uiStateID;
    } else {
      invariant(extractId, 'extractId is required when uiStateID is undefined');
      invariant(fileName, 'fileName is required when uiStateID is undefined');
      computedUIStateID =
        props.uiStateID || generateId({ fileName, id: extractId(props) });
    }
    const uiState = state.uiState[computedUIStateID] || initialState;
    return {
      uiState,
      uiStateID: computedUIStateID,
    };
  };

  return mapStateToProps;
};

export const mergeUIStateProps = (
  stateProps: Object,
  dispatchProps: Object,
  ownProps: Object,
) => {
  const { dispatch } = dispatchProps;
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    setUIState: (change: Object) => {
      dispatch(setUIState({ id: stateProps.uiStateID, change }));
    },
  };
};

export const withUIState = ({
  fileName,
  extractId,
  // TODO: make this non-optional, like this.setState()
  initialState = {},
}: {|
  fileName: string,
  extractId: ExtractIdType,
  initialState?: Object,
|}): ((React.ComponentType<any>) => React.ComponentType<any>) => {
  invariant(fileName, 'fileName is required');
  invariant(extractId, 'extractId is required');
  invariant(initialState, 'initialState is required');

  const mapStateToProps = createUIStateMapper({
    extractId,
    fileName,
    initialState,
  });

  return (WrappedComponent) => {
    class WithUIState extends React.Component<any> {
      componentDidMount() {
        // Every time the component mounts, reset the state regardless
        // of what is saved in the Redux store. This makes the
        // implementation behave more like this.setState() whereby
        // the component constructor() would always initialize
        // like this.state = {...}.
        //
        // TODO: Optimize this by only dispatching if
        // props.uiState doesn't match initialState?
        this.props.setUIState(initialState);
      }

      render() {
        return <WrappedComponent {...this.props} />;
      }
    }

    return compose(
      connect(
        mapStateToProps,
        undefined,
        mergeUIStateProps,
      ),
    )(WithUIState);
  };
};

type UIStateActions = SetUIStateAction;

export default function uiStateReducer(
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
