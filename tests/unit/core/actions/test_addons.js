import { fetchAddon } from 'core/actions/addons';
import { createStubErrorHandler } from 'tests/unit/helpers';

describe('core.actions.addons', () => {
  describe('fetchAddon', () => {
    const defaultParams = Object.freeze({
      slug: 'addon-slug',
      errorHandler: createStubErrorHandler(),
    });

    it('requires an error handler', () => {
      const params = { ...defaultParams };
      delete params.errorHandler;
      expect(() => fetchAddon(params))
        .toThrowError(/errorHandler cannot be empty/);
    });

    it('requires a slug', () => {
      const params = { ...defaultParams };
      delete params.slug;
      expect(() => fetchAddon(params))
        .toThrowError(/slug cannot be empty/);
    });
  });
});
