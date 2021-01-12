import createStore from 'amo/store';
import { initialState } from 'amo/reducers/addons';

describe(__filename, () => {
  it('creates an empty store', () => {
    const { store } = createStore();
    expect(store.getState().addons).toEqual(initialState);
  });
});
