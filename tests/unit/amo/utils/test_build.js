import { getDeploymentVersion } from 'amo/utils/build';

describe(__filename, () => {
  describe('getDeploymentVersion', () => {
    const getVersionJson = ({
      commit = '81728b8478c73d47bbe3688b2a40b25355b36939',
      version = '1.2.3',
    } = {}) => {
      return {
        commit,
        version,
      };
    };

    it('returns the version found in the version.json file', () => {
      const versionJson = getVersionJson();

      expect(getDeploymentVersion({ versionJson })).toEqual(
        versionJson.version,
      );
    });

    it('returns the commit if version is undefined', () => {
      const versionJson = getVersionJson();
      delete versionJson.version;

      expect(getDeploymentVersion({ versionJson })).toEqual(versionJson.commit);
    });

    it('returns the commit if version is null', () => {
      const versionJson = getVersionJson({ version: null });

      expect(getDeploymentVersion({ versionJson })).toEqual(versionJson.commit);
    });

    it('returns the commit if version is an empty string', () => {
      const versionJson = getVersionJson({ version: '' });

      expect(getDeploymentVersion({ versionJson })).toEqual(versionJson.commit);
    });
  });
});
