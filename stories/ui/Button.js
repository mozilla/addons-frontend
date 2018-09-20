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

// TODO: Add flow type here once it's set up in the Button component.
function createPropsMatrix(buttonType) {
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
    createPropsMatrix,
    children: label,
  }),
});
