import type { ReactRouterHistoryType } from 'amo/types/router';
// This is a type function that takes a state type and returns a reducer
// type, i.e. a function that accepts and returns the same state type.

/* eslint-disable no-undef */
export type CreateReducerType = <AnyState>(arg0: AnyState) => (arg0: AnyState, action: Record<string, any>) => AnyState;

/* eslint-enable no-undef */
export type CreateStoreParams = {
  history: ReactRouterHistoryType;
  initialState: Record<string, any>;
};