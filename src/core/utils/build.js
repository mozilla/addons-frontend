/* @flow */

type GetDeploymentVersionParams = {|
  versionJson: {
    commit: string,
    version?: string,
  },
|};

export const getDeploymentVersion = ({
  versionJson,
}: GetDeploymentVersionParams): string => {
  const deploymentVersion =
    versionJson.version && versionJson.version.length
      ? versionJson.version
      : versionJson.commit;

  return deploymentVersion;
};
