/* @flow */
import type { SendTrackingEventParams } from 'amo/tracking';

export const STORE_TRACKING_EVENT: 'STORE_TRACKING_EVENT' =
  'STORE_TRACKING_EVENT';

export type TrackingEvent = SendTrackingEventParams;

export type TrackingState = {
  events: Array<TrackingEvent>,
};

export const initialState: TrackingState = {
  events: [],
};

type StoreTrackingEventParams = {|
  event: TrackingEvent,
|};

export type StoreTrackingEventAction = {|
  type: typeof STORE_TRACKING_EVENT,
  payload: StoreTrackingEventParams,
|};

export const storeTrackingEvent = ({
  event,
}: StoreTrackingEventParams): StoreTrackingEventAction => {
  return {
    type: STORE_TRACKING_EVENT,
    payload: { event },
  };
};

type Action = StoreTrackingEventAction;

export default function siteReducer(
  state: TrackingState = initialState,
  action: Action,
): TrackingState {
  switch (action.type) {
    case STORE_TRACKING_EVENT: {
      const { event } = action.payload;

      return {
        ...state,
        events: [...state.events, event],
      };
    }
    default:
      return state;
  }
}
