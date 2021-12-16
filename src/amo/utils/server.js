/* @flow */
/* global fetch */
import path from 'path';

import fs from 'fs-extra';
import config from 'config';
import { $Request, $Response } from 'express';

import log from 'amo/logger';

const PREFIX = 'enableFeature';

type ExpressHandler = (
  req: typeof $Request,
  res: typeof $Response,
) => void | Promise<void>;

type ViewFrontendVersionHandlerParams = {|
  _config?: typeof config,
  _log?: typeof log,
  versionFilename?: string,
|};

type ViewHeartbeatHandlerParams = {|
  _config?: typeof config,
|};

export const viewFrontendVersionHandler = ({
  _config = config,
  _log = log,
  // This is a magic file that gets written by deployment scripts.
  versionFilename = 'version.json',
}: ViewFrontendVersionHandlerParams = {}): ExpressHandler => {
  const version = path.join(_config.get('basePath'), versionFilename);

  const featureFlags = Object.keys(_config)
    .filter((key) => {
      return key.startsWith(PREFIX);
    })
    .reduce((map, key) => {
      return {
        ...map,
        [key]: _config.get(key),
      };
    }, {});

  const experiments = _config.get('experiments') || {};

  return (req: typeof $Request, res: typeof $Response) => {
    fs.stat(version, async (error) => {
      if (error) {
        _log.error(
          `Could not stat version file ${version}: ${error.toString()}`,
        );
        res.sendStatus(415);
      } else {
        const versionJson = await fs.readJson(version);

        // Allow anyone to fetch this file.
        res.header('Access-Control-Allow-Origin', '*');
        res.json({
          ...versionJson,
          experiments,
          feature_flags: featureFlags,
        });
      }
    });
  };
};

export const viewHeartbeatHandler = ({
  _config = config,
  _fetch = fetch,
}: ViewHeartbeatHandlerParams = {}): ExpressHandler => {
  const apiURL = `${_config.get('apiHost')}${_config.get(
    'apiPath',
  )}${_config.get('apiVersion')}/site/?disable_caching`;

  return async (req: typeof $Request, res: typeof $Response) => {
    const response = await _fetch(apiURL);
    if (response.status !== 200) {
      res.sendStatus(400);
    } else {
      const siteStatus = await response.json();
      res.json({ siteStatus });
      // Allow anyone to fetch this file.
      res.header('Access-Control-Allow-Origin', '*');
    }
  };
};
