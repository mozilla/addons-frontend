import createStore from 'disco/store';

describe(__filename, () => {
  it('sets the reducers', () => {
    const { store } = createStore();
    expect(Object.keys(store.getState()).sort()).toEqual([
      'addons',
      'api',
      'discoResults',
      'errorPage',
      'errors',
      'infoDialog',
      'installations',
      'redirectTo',
      'router',
      'survey',
      'uiState',
    ]);
  });
});
