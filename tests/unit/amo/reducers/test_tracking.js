import reducer, {
  initialState,
  storeTrackingEvent,
} from 'amo/reducers/tracking';
import { fakeTrackingEvent } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, { type: 'NONE' });

      expect(state).toEqual(initialState);
    });

    it('stores a tracking event', () => {
      const event = fakeTrackingEvent;

      const state = reducer(undefined, storeTrackingEvent({ event }));

      expect(state.events).toEqual([event]);
    });

    it('can store multiple tracking events', () => {
      const event1 = fakeTrackingEvent;
      const event2 = { ...fakeTrackingEvent, action: 'action-2' };

      let state = reducer(undefined, storeTrackingEvent({ event: event1 }));
      state = reducer(state, storeTrackingEvent({ event: event2 }));

      expect(state.events).toEqual([event1, event2]);
    });
  });
});
