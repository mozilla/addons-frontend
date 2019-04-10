/* @flow */
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
