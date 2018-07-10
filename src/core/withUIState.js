/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import { connect } from 'react-redux';

import { normalizeFileNameId } from 'core/utils';
import { setUIState } from 'core/reducers/uiState';
import type { UIStateType } from 'core/reducers/uiState';

type ExtractIdFunc = (props: Object) => string;

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
  extractId?: ExtractIdFunc,
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

const withUIState = ({
  fileName,
  extractId,
  initialState,
}: {|
  fileName: string,
  extractId: ExtractIdFunc,
  initialState: Object,
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

    return connect(
      mapStateToProps,
      undefined,
      mergeUIStateProps,
    )(WithUIState);
  };
};

export default withUIState;
