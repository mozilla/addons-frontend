import viewContext, { initialState } from 'amo/reducers/viewContext';
import { VIEW_CONTEXT_HOME } from 'amo/constants';

describe(__filename, () => {
  it('defaults to explore', () => {
    const state = viewContext(initialState, {});
    expect(state).toEqual({
      context: VIEW_CONTEXT_HOME,
    });
  });
});