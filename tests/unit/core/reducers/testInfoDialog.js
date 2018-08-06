import infoDialog, {
  closeInfoDialog,
  initialState,
  showInfoDialog,
} from 'core/reducers/infoDialog';

describe(__filename, () => {
  it('initializes properly', () => {
    expect(infoDialog(undefined, { type: 'UNRELATED' })).toEqual(initialState);
  });

  it('shows a dialog with SHOW_INFO', () => {
    const payload = { foo: 'bar' };
    expect(infoDialog(undefined, showInfoDialog(payload))).toEqual({
      show: true,
      data: payload,
    });
  });

  it('maintains state with unrelated state changes', () => {
    const payload = { foo: 'bar' };
    const state = infoDialog(undefined, showInfoDialog(payload));

    expect(infoDialog(state, { type: 'WHATEVS' })).toEqual(state);
  });

  it('hides a dialog with CLOSE_INFO ', () => {
    const payload = { foo: 'bar' };
    const prevState = infoDialog(undefined, showInfoDialog(payload));

    expect(infoDialog(prevState, closeInfoDialog())).toEqual(initialState);
  });
});
