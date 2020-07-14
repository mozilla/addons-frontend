/* @flow */
import invariant from 'invariant';

export const SET_HASHED_CLIENT_ID: 'SET_HASHED_CLIENT_ID' =
  'SET_HASHED_CLIENT_ID';

export type TelemetryState = {|
  hashedClientId: string | null,
|};

export const initialState: TelemetryState = {
  hashedClientId: null,
};

type SetHashedClientIdAction = {|
  type: typeof SET_HASHED_CLIENT_ID,
  payload: { hashedClientId: string },
|};

export const setHashedClientId = (
  hashedClientId: string,
): SetHashedClientIdAction => {
  invariant(hashedClientId, 'hashedClientId is required');

  return {
    type: SET_HASHED_CLIENT_ID,
    payload: { hashedClientId },
  };
};

export default function telemetry(
  state: TelemetryState = initialState,
  action: SetHashedClientIdAction,
): TelemetryState {
  switch (action.type) {
    case SET_HASHED_CLIENT_ID: {
      return {
        ...state,
        hashedClientId: action.payload.hashedClientId,
      };
    }
    default:
      return state;
  }
}
