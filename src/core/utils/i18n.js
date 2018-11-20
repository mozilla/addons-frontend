/* @flow */
import type { I18nType } from 'core/types/i18n';

type GetLocalizedTextWithLinkPartsParams = {|
  i18n: I18nType,
  text: string,
  linkStart?: string,
  linkEnd?: string,
|};

export const getLocalizedTextWithLinkParts = ({
  i18n,
  text,
  linkStart = 'linkStart',
  linkEnd = 'linkEnd',
}: GetLocalizedTextWithLinkPartsParams): Object => {
  const splitOn = '__LINK__';

  const localizedExploreMoreLink = i18n.sprintf(text, {
    [linkStart]: splitOn,
    [linkEnd]: splitOn,
  });

  const parts = localizedExploreMoreLink.split(splitOn);

  return {
    beforeLinkText: parts[0],
    innerLinkText: parts[1],
    afterLinkText: parts[2],
  };
};
