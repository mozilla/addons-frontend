/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import AMInstallButton from 'core/components/AMInstallButton';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalVersion } from 'core/reducers/versions';
import { validInstallStates } from 'core/constants';
import { fakeAddon, fakeVersion } from 'tests/unit/helpers';

import Provider from '../setup/Provider';

const lang = 'en-US';
const render = (otherProps) => {
  const props = {
    addon: createInternalAddon(fakeAddon, lang),
    canUninstall: true,
    currentVersion: createInternalVersion(fakeVersion, lang),
    disabled: false,
    enable: () => Promise.resolve(true),
    hasAddonManager: true,
    install: () => Promise.resolve(true),
    isAddonEnabled: () => Promise.resolve(true),
    puffy: true,
    setCurrentStatus: () => Promise.resolve(true),
    status: 'UNKNOWN',
    uninstall: () => Promise.resolve(true),
    ...otherProps,
  };

  return <AMInstallButton {...props} />;
};

const createChapters = ({ puffy }) => [
  {
    sections: validInstallStates.map((status) => ({
      title: `installation status = ${status}`,
      sectionFn: () => render({ puffy, status }),
    })),
  },
  {
    sections: validInstallStates.map((status) => ({
      title: `disabled state with installation status = ${status}`,
      sectionFn: () => render({ puffy, status, disabled: true }),
    })),
  },
  {
    sections: validInstallStates.map((status) => ({
      title: `canUninstall = false and installation status = ${status}`,
      sectionFn: () => render({ puffy, status, canUninstall: false }),
    })),
  },
];

storiesOf('AMInstallButton', module)
  .addDecorator((story) => (
    <div className="AMInstallButton--storybook">
      <Provider story={story()} />
    </div>
  ))
  .addWithChapters('all puffy variants', {
    chapters: createChapters({ puffy: true }),
  })
  .addWithChapters('all non-puffy variants', {
    chapters: createChapters({ puffy: false }),
  });
