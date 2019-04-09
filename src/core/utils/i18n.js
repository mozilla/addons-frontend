/* @flow */
import * as React from 'react';
import invariant from 'invariant';

import type { I18nType } from 'core/types/i18n';

type GetLocalizedTextWithLinkPartsParams = {|
  i18n: I18nType,
  text: string,
  linkStart?: string,
  linkEnd?: string,
  otherVars?: Object,
|};

export const getLocalizedTextWithLinkParts = ({
  i18n,
  text,
  linkStart = 'linkStart',
  linkEnd = 'linkEnd',
  otherVars,
}: GetLocalizedTextWithLinkPartsParams = {}): Object => {
  const linkDelimiter = '__LINK__';

  const localizedLink = i18n.sprintf(text, {
    [linkStart]: linkDelimiter,
    [linkEnd]: linkDelimiter,
    ...otherVars,
  });

  const parts = localizedLink.split(linkDelimiter);

  invariant(
    parts.length === 3,
    'linkStart and linkEnd values cannot be missing from text',
  );

  return {
    beforeLinkText: parts[0],
    innerLinkText: parts[1],
    afterLinkText: parts[2],
  };
};

export const getReplacementKey = (start: string, end: string): string => {
  return `${start},${end}`;
};

type ReplaceStringsWithJSXParams = {|
  text: string,
  // `replacementKey` should be computed with `getReplacementKey()`.
  replacements: { [replacementKey: string]: (text: string) => React.Node },
|};

export const replaceStringsWithJSX = ({
  text,
  replacements,
}: ReplaceStringsWithJSXParams): Array<React.Node | string> => {
  const numberOfReplacements = Object.keys(replacements).length;

  if (numberOfReplacements === 0) {
    return [text];
  }

  const expression = new RegExp(
    [
      // Before any replacement (pair of keys).
      '^(.*?)',
      // Add a generic regexp to match each replacement entry, possibly
      // separated by some more text.
      Object.keys(replacements)
        .map(() => '%\\((\\w+)\\)s(.+?)%\\((\\w+)\\)s')
        .join('(.*?)'),
      // After all replacements (pairs of keys).
      '(.*?)$',
    ].join(''),
  );

  const matches = text.match(expression);

  if (!matches) {
    // This usually happens when the number of pairs of keys in `text` is not
    // the same as the number of entries in the `replacements` argument.
    throw new Error(
      '`text` does not appear to be compatible with the provided replacements',
    );
  }

  // The first entry is always the whole string (a.k.a. `text`), so let's
  // remove it before processing this array.
  matches.shift();

  const output = [];
  let notReplaced = numberOfReplacements;

  while (matches.length) {
    const keyOrText = matches.shift();

    // Look-ahead to see if we found a known pair of keys.
    if (replacements[getReplacementKey(keyOrText, matches[1])]) {
      const innerText = matches.shift();
      const secondKey = matches.shift();
      const replaceFn = replacements[getReplacementKey(keyOrText, secondKey)];

      output.push(replaceFn(innerText));
      notReplaced--;
    } else {
      output.push(keyOrText);
    }
  }

  if (notReplaced > 0) {
    throw new Error('Not all replacements have been used');
  }

  return output;
};
