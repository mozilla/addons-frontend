/* @flow */

type GetSentryReleaseParams = {|
  version: string,
|};

export const getSentryRelease = ({ version }: GetSentryReleaseParams) => {
  return `addons-frontend@${version}`;
};
