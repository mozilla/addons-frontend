/* @flow */

export type GetTagResultsPathnameParams = {
  tag: string,
};

export const getTagResultsPathname = ({
  tag,
}: GetTagResultsPathnameParams): string => {
  return `/tag/${tag}/`;
};
