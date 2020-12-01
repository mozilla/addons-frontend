import { getSentryRelease } from 'core/utils/sentry';

describe(__filename, () => {
  describe('getSentryRelease', () => {
    it('creates a release ID', () => {
      const version = '1.2.3';

      expect(getSentryRelease({ version })).toEqual(
        `addons-frontend@${version}`,
      );
    });
  });
});
