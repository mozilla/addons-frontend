import { fetchAddon } from 'core/actions/addons';

describe('core.actions.addons', () => {
  describe('fetchAddon', () => {
    it('requires a slug', () => {
      expect(() => fetchAddon({})).toThrowError(/slug cannot be empty/);
    });
  });
});
