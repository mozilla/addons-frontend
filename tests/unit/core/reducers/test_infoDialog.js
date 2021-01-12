import infoDialog, {
  closeInfoDialog,
  initialState,
  showInfoDialog,
} from 'amo/reducers/infoDialog';

describe(__filename, () => {
  const getInfoDialogData = () => {
    return {
      addonName: 'some addon',
      imageURL: 'http://example.org/image.png',
    };
  };

  it('initializes properly', () => {
    expect(infoDialog(undefined, { type: 'UNRELATED' })).toEqual(initialState);
  });

  it('shows a dialog with SHOW_INFO', () => {
    const payload = getInfoDialogData();
    expect(infoDialog(undefined, showInfoDialog(payload))).toEqual({
      show: true,
      data: payload,
    });
  });

  it('maintains state with unrelated state changes', () => {
    const payload = getInfoDialogData();
    const state = infoDialog(undefined, showInfoDialog(payload));

    expect(infoDialog(state, { type: 'WHATEVS' })).toEqual(state);
  });

  it('hides a dialog with CLOSE_INFO', () => {
    const payload = getInfoDialogData();
    const prevState = infoDialog(undefined, showInfoDialog(payload));

    expect(infoDialog(prevState, closeInfoDialog())).toEqual(initialState);
  });
});
