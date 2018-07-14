import infoDialog from 'core/reducers/infoDialog';
import { SHOW_INFO, CLOSE_INFO } from 'core/constants';

describe(__filename, () => {
  it('defaults to an empty object', () => {
    expect(infoDialog(undefined, { type: 'UNRELATED' })).toEqual({});
  });

  it('shows a dialog with SHOW_INFO', () => {
    const payload = { foo: 'bar' };
    expect(infoDialog({}, { type: SHOW_INFO, payload })).toEqual({
      show: true,
      data: payload,
    });
  });

  it('maintains state with unrelated state changes', () => {
    const payload = { foo: 'bar' };
    expect(
      infoDialog({ show: true, data: payload }, { type: 'WHATEVS' }),
    ).toEqual({ show: true, data: payload });
  });

  it('hides a dialog with CLOSE_INFO ', () => {
    expect(infoDialog({}, { type: CLOSE_INFO })).toEqual({ show: false });
  });
});
