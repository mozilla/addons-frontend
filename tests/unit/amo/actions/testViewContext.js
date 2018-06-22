import { setViewContext } from 'amo/actions/viewContext';

describe('amo/actions/setViewContext', () => {
  it('requires a context', () => {
    expect(() => setViewContext()).toThrow(/context parameter is required/);
  });
});
