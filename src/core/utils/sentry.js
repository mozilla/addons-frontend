/* @flow */

type GetSentryReleaseParams = {|
  appName: string,
  version: string,
|};

export const getSentryRelease = ({
  appName,
  version,
}: GetSentryReleaseParams) => {
  return `addons-frontend-${appName}@${version}`;
};
