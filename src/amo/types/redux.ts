// This defines some Redux interfaces that we want to depend on.
// It may be possible to use an official library for this.
// See: https://github.com/reactjs/react-redux/pull/389
// and: https://github.com/reactjs/redux/pull/1887/files#diff-46d86d39c8da613247f843ee8ca43ebc
export type DispatchFunc = (action: Record<string, any>) => void;
export type ReduxStore = {
  dispatch: DispatchFunc;
  getState: () => Record<string, any>;
};