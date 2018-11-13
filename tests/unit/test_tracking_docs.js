import { readFile } from 'fs';

import { HCT_METHOD_MAPPING } from 'core/constants';

describe(__filename, () => {
  describe('Tracking docs', () => {
    let markdown;

    beforeAll((done) => {
      readFile('docs/telemetry.md', 'utf8', (err, data) => {
        markdown = data;
        done();
      });
    });

    it.each(Object.values(HCT_METHOD_MAPPING))(
      'should have documented %s in docs/telemetry.md',
      (method) => {
        expect(markdown.indexOf(method) > -1).toBe(true);
      },
    );
  });
});
