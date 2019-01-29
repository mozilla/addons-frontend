import { getCanonicalURL } from 'amo/utils';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getCanonicalURL', () => {
    it(`returns an absolute canonical URL`, () => {
      const locationPathname = '/path/name';
      const baseURL = 'https://example.org';
      const _config = getFakeConfig({ baseURL });

      expect(getCanonicalURL({ _config, locationPathname })).toEqual(
        `${baseURL}${locationPathname}`,
      );
    });
  });
});
