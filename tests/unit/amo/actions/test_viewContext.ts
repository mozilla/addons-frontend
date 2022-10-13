import { setViewContext } from 'amo/actions/viewContext';

describe(__filename, () => {
  it('requires a context', () => {
    expect(() => setViewContext()).toThrow(/context parameter is required/);
  });
});