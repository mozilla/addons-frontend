import '@storybook/addon-options/register';

import registerScissors from 'storybook-addon-scissors';
import devicesJSON from './devices.json';

const devices = devicesJSON.extensions.map(({ device }) => ({
  uid: device.title,
  title: device.title,
  width: device.screen.vertical.width,
  height: device.screen.vertical.height,
}));

registerScissors(devices);
