/* @flow */
import fs from 'fs';
import path from 'path';

import config from 'config';
import type { $Request, $Response } from 'express';

import log from 'core/logger';

type ExpressHandler = (req: $Request, res: $Response) => void;

type ViewFrontendVersionHandlerParams = {|
  _config: typeof config,
  _log: typeof log,
|};

export const viewFrontendVersionHandler = ({
  _config = config,
  _log = log,
}: ViewFrontendVersionHandlerParams = {}): ExpressHandler => {
  // This is a magic file that gets written by deployment scripts.
  const version = path.join(_config.get('basePath'), 'version.json');

  return (req: $Request, res: $Response) => {
    fs.stat(version, (error) => {
      if (error) {
        _log.error(
          `Could not stat version file ${version}: ${error.toString()}`,
        );
        res.sendStatus(415);
      } else {
        res.setHeader('Content-Type', 'application/json');
        fs.createReadStream(version).pipe(res);
      }
    });
  };
};
