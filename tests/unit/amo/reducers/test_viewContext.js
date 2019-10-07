import { LOCATION_CHANGE } from 'connected-react-router';

import { setViewContext } from 'amo/actions/viewContext';
import viewContext, { initialState } from 'amo/reducers/viewContext';
import {
  ADDON_TYPE_EXTENSION,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  it('defaults to explore', () => {
    const state = viewContext(initialState, {});

    expect(state).toEqual({ context: VIEW_CONTEXT_EXPLORE });
  });

  describe('LOCATION_CHANGE', () => {
    it('resets the state on the client when the current viewContext is VIEW_CONTEXT_HOME', () => {
      const _config = getFakeConfig({ server: false });

      let state = viewContext(undefined, setViewContext(VIEW_CONTEXT_HOME));
      expect(state.context).toEqual(VIEW_CONTEXT_HOME);

      state = viewContext(state, { type: LOCATION_CHANGE }, _config);
      expect(state).toEqual(initialState);
    });

    it('does not reset the state on the server', () => {
      const _config = getFakeConfig({ server: true });
      let state = viewContext(undefined, setViewContext(VIEW_CONTEXT_HOME));

      state = viewContext(state, { type: LOCATION_CHANGE }, _config);
      expect(state.context).toEqual(VIEW_CONTEXT_HOME);
    });

    it('does not reset the state when the current viewContext is not VIEW_CONTEXT_HOME', () => {
      const _config = getFakeConfig({ server: false });
      let state = viewContext(undefined, setViewContext(ADDON_TYPE_EXTENSION));

      state = viewContext(state, { type: LOCATION_CHANGE }, _config);
      expect(state.context).toEqual(ADDON_TYPE_EXTENSION);
    });
  });
});
