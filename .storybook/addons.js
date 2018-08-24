import '@storybook/addon-knobs/register';
import '@storybook/addon-options/register';
import '@storybook/addon-actions/register';
import registerScissors from 'storybook-addon-scissors';
import devicesJSON from './devices.json';
// import '@storybook/addon-links/register';

const devices = devicesJSON.extensions.map(({ device }) => ({
  uid: device.title,
  title: device.title,
  width: device.screen.vertical.width,
  height: device.screen.vertical.height,
}));

registerScissors(devices);
