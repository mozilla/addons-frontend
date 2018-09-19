/* @flow */
import { storiesOf } from '@storybook/react';

import { createChapters } from 'stories/utils';
import Button from 'ui/components/Button';

const label = 'Hello Button';
const buttonTypes = [
  undefined,
  'neutral',
  'alert',
  'light',
  'action',
  'cancel',
  'confirm',
];

// TODO: add flow type here once it's set up in Button component.
function createSections(buttonType) {
  return [
    {
      props: {
        buttonType,
      },
    },
    {
      props: {
        buttonType,
        disabled: true,
      },
    },
    {
      props: {
        buttonType,
        puffy: true,
      },
    },
    {
      props: {
        buttonType,
        puffy: true,
        disabled: true,
      },
    },
    {
      props: {
        buttonType,
        micro: true,
      },
    },
    {
      props: {
        buttonType,
        micro: true,
        disabled: true,
      },
    },
  ];
}

storiesOf('Button', module).addWithChapters('Button variations', {
  chapters: createChapters({
    Component: Button,
    sections: buttonTypes,
    createSections,
    children: label,
  }),
});
