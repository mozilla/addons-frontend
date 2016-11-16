import infoDialog from 'core/reducers/infoDialog';
import { SHOW_INFO, CLOSE_INFO } from 'core/constants';

describe('infoDialog reducer', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(infoDialog(undefined, { type: 'UNRELATED' }), {});
  });

  it('shows a dialog with SHOW_INFO', () => {
    const payload = { foo: 'bar' };
    assert.deepEqual(
      infoDialog({}, { type: SHOW_INFO, payload }),
      { show: true, data: payload }
    );
  });

  it('maintains state with unrelated state changes', () => {
    const payload = { foo: 'bar' };
    assert.deepEqual(
      infoDialog({ show: true, data: payload }, { type: 'WHATEVS' }),
      { show: true, data: payload }
    );
  });

  it('hides a dialog with CLOSE_INFO ', () => {
    assert.deepEqual(
      infoDialog({}, { type: CLOSE_INFO }),
      { show: false }
    );
  });
});
