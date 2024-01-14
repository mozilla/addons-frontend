/* @flow */
import * as React from 'react';
import invariant from 'invariant';
import { connect } from 'react-redux';

import { getDisplayName, normalizeFileNameId } from 'amo/utils';
import { selectUIState, setUIState } from 'amo/reducers/uiState';
import type { AppState } from 'amo/store';

type ExtractIdFunc = (props: Object) => string;

export const generateId = ({
  fileName,
  id,
}: {|
  fileName: string,
  id: string,
|}): string => {
  invariant(fileName, 'fileName is required');
  invariant(typeof id === 'string', 'id must be a string');

  return `${normalizeFileNameId(fileName)}-${id}`;
};

export const createUIStateMapper = ({
  initialState,
  extractId,
  fileName,
}: {|
  initialState: Object,
  extractId?: ExtractIdFunc,
  fileName?: string,
|}): ((
  state: AppState,
  props: Object,
) => {| uiState: Object, uiStateID: string |}) => {
  invariant(initialState, 'initialState is required');
  const mapStateToProps = (state: AppState, props: Object) => {
    invariant(extractId, 'extractId is required.');
    invariant(fileName, 'fileName is required.');
    const uiStateID = generateId({ fileName, id: extractId(props) });
    const uiState =
      selectUIState({ uiState: state.uiState, uiStateID }) || initialState;
    return {
      uiState,
      uiStateID,
    };
  };

  return mapStateToProps;
};

export const mergeUIStateProps = (
  stateProps: Object,
  dispatchProps: Object,
  ownProps: Object,
): Object => {
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

/*
 * This HOC can be used to somewhat mimic the behavior of this.setState()
 * with Redux reducers/actions.
 *
 * It renders your component with a setUIState() prop that can be used
 * just like this.setState() to dispatch actions that change the internal
 * state of the component.
 *
 * It provides a uiState prop which can be used to read internal state
 * like you would read this.state.
 *
 * One key difference from this.setState() is that your component will
 * not reset its state when mounted. Instead, it uses
 * the ID returned from extractID(props) to get its state from the
 * Redux store.
 *
 * You can make the component always reset its state by configuring
 * withUIState({ ..., resetOnUnmount: true }).
 *
 * This will behave more like this.setState() but you will lose some
 * features of Redux persistence such as predictable hot reloading and
 * possibly other state replay features.
 */
const withUIState = ({
  fileName,
  extractId,
  initialState,
  resetOnUnmount = false,
}: {|
  // This should always be set to __filename for ID purposes.
  fileName: string, // A function that takes component props and returns a string to identify this state.
  extractId: ExtractIdFunc, // An Object that defines the initial state.
  initialState: Object, // When false (the default), every component instance will always
  // render using persistent Redux state. When true, component state will
  // be reset when it is unmounted. Set this to true to more closely
  // mimic this.setState() behavior.
  resetOnUnmount?: boolean,
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
      componentWillUnmount() {
        if (resetOnUnmount) {
          this.props.setUIState(initialState);
        }
      }

      render() {
        return <WrappedComponent {...this.props} />;
      }
    }

    // eslint-disable-next-line react/static-property-placement
    WithUIState.displayName = `WithUIState(${getDisplayName(
      WrappedComponent,
    )})`;

    return connect(mapStateToProps, undefined, mergeUIStateProps)(WithUIState);
  };
};

export default withUIState;
