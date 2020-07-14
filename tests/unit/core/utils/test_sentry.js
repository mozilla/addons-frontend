import { getSentryRelease } from 'core/utils/sentry';

describe(__filename, () => {
  describe('getSentryRelease', () => {
    it('creates a release ID', () => {
      const appName = 'app';
      const version = '1.2.3';

      expect(getSentryRelease({ appName, version })).toEqual(
        `addons-frontend-${appName}@${version}`,
      );
    });
  });
});
