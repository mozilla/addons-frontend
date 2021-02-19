/* @flow */

type GetSentryReleaseParams = {|
  version: string,
|};

export const getSentryRelease = ({ version }: GetSentryReleaseParams): string => {
  return `addons-frontend@${version}`;
};
