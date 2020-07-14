import viewContext, { initialState } from 'amo/reducers/viewContext';
import { VIEW_CONTEXT_EXPLORE } from 'core/constants';

describe(__filename, () => {
  it('defaults to explore', () => {
    const state = viewContext(initialState, {});

    expect(state).toEqual({ context: VIEW_CONTEXT_EXPLORE });
  });
});
