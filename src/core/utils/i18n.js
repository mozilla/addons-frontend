/* @flow */
import invariant from 'invariant';

import type { I18nType } from 'core/types/i18n';

type GetLocalizedTextWithLinkPartsParams = {|
  i18n: I18nType,
  text: string,
|};

export const getLocalizedTextWithLinkParts = ({
  i18n,
  text,
}: GetLocalizedTextWithLinkPartsParams): Object => {
  invariant(i18n, 'i18n is required');
  invariant(text, 'text is required');

  const linkEnds = '__LINK__';

  const localizedExploreMoreLink = i18n.sprintf(text, {
    linkStart: linkEnds,
    linkEnd: linkEnds,
  });

  const parts = localizedExploreMoreLink.split(linkEnds);

  return {
    beforeLinkText: parts[0],
    innerLinkText: parts[1],
    afterLinkText: parts[2],
  };
};
