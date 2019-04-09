import * as React from 'react';

import Link from 'amo/components/Link';
import {
  getLocalizedTextWithLinkParts,
  replaceStringsWithJSX,
} from 'core/utils/i18n';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getLocalizedTextWithLinkParts', () => {
    const _getLocalizedTextWithLinkParts = ({
      i18n = fakeI18n(),
      text = 'Explore more %(linkStart)s stuff %(linkEnd)s here.',
      linkStart = 'linkStart',
      linkEnd = 'linkEnd',
      otherVars,
    } = {}) => {
      return getLocalizedTextWithLinkParts({
        i18n,
        text: fakeI18n().gettext(text),
        linkStart,
        linkEnd,
        otherVars,
      });
    };

    it('returns a descriptive object', () => {
      const parts = _getLocalizedTextWithLinkParts();

      expect(parts).toHaveProperty('beforeLinkText');
      expect(parts.beforeLinkText).toEqual('Explore more ');

      expect(parts).toHaveProperty('innerLinkText');
      expect(parts.innerLinkText).toEqual(' stuff ');

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(' here.');
    });

    it('lets you pass in different linkStart and linkEnd values', () => {
      const parts = _getLocalizedTextWithLinkParts({
        text: 'Explore more %(wrapperStart)s cool stuff %(wrapperEnd)s here.',
        linkStart: 'wrapperStart',
        linkEnd: 'wrapperEnd',
      });

      expect(parts).toHaveProperty('beforeLinkText');
      expect(parts.beforeLinkText).toEqual('Explore more ');

      expect(parts).toHaveProperty('innerLinkText');
      expect(parts.innerLinkText).toEqual(' cool stuff ');

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(' here.');
    });

    it('lets you pass in additional variables', () => {
      const anotherVar = 'another value';
      const parts = _getLocalizedTextWithLinkParts({
        text: 'Explore more %(linkStart)s stuff %(linkEnd)s %(anotherVar)s.',
        otherVars: {
          anotherVar,
        },
      });

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(` ${anotherVar}.`);
    });

    it('throws an error if linkStart and/or linkEnd values are missing from text', () => {
      expect(() => {
        _getLocalizedTextWithLinkParts({
          text: 'Just some text.',
        });
      }).toThrow(/linkStart and linkEnd values cannot be missing from text/);
    });
  });

  describe('replaceStringsWithJSX', () => {
    it('lets you replace format strings with JSX', () => {
      expect(
        replaceStringsWithJSX({
          text:
            'Click on %(redLinkStart)sred%(redLinkEnd)s or %(blueLinkStart)sblue%(blueLinkEnd)s, your choice',
          replacements: [
            [
              'redLinkStart',
              'redLinkEnd',
              (text) => (
                <Link key="red" to="/red">
                  {text}
                </Link>
              ),
            ],
            [
              'blueLinkStart',
              'blueLinkEnd',
              (text) => (
                <Link key="blue" to="/blue">
                  {text}
                </Link>
              ),
            ],
          ],
        }),
      ).toEqual([
        'Click on ',
        <Link key="red" to="/red">
          red
        </Link>,
        ' or ',
        <Link key="blue" to="/blue">
          blue
        </Link>,
        ', your choice',
      ]);
    });

    it('lets you replace format strings with JSX in any order', () => {
      expect(
        replaceStringsWithJSX({
          text:
            'Click on %(blueLinkStart)sblue%(blueLinkEnd)s or %(redLinkStart)sred%(redLinkEnd)s, your choice',
          replacements: [
            [
              'redLinkStart',
              'redLinkEnd',
              (text) => {
                return (
                  <Link key="red" to="/red">
                    {text}
                  </Link>
                );
              },
            ],
            [
              'blueLinkStart',
              'blueLinkEnd',
              (text) => {
                return (
                  <Link key="blue" to="/blue">
                    {text}
                  </Link>
                );
              },
            ],
          ],
        }),
      ).toEqual([
        'Click on ',
        <Link key="blue" to="/blue">
          blue
        </Link>,
        ' or ',
        <Link key="red" to="/red">
          red
        </Link>,
        ', your choice',
      ]);
    });

    it('returns an array with `text` when there is no replacement', () => {
      const text = 'some localized content';

      expect(replaceStringsWithJSX({ text, replacements: [] })).toEqual([text]);
    });

    it('throws an error when the `text` has no variables and there are replacements', () => {
      expect(() => {
        replaceStringsWithJSX({
          text: 'some localized content',
          replacements: [['start', 'end', (text) => text]],
        });
      }).toThrow(/does not appear to be compatible/);
    });

    it('throws an error when the `text` is an empty string and there are replacements', () => {
      expect(() => {
        replaceStringsWithJSX({
          text: '',
          replacements: [['start', 'end', (text) => text]],
        });
      }).toThrow(/does not appear to be compatible/);
    });

    it('throws an error when not all replacements have been used', () => {
      expect(() => {
        replaceStringsWithJSX({
          text:
            'a string with %(startFirst)sa link%(endFirst)s and %(startSecond)sanother one%(endSecond)s.',
          replacements: [
            ['startA', 'endA', (text) => text],
            ['startB', 'endB', (text) => text],
          ],
        });
      }).toThrow(
        /Not all replacements have been used; unused keys: startA,endA; startB,endB/,
      );
    });
  });
});
