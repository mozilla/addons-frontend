/* @flow */
import { storiesOf } from '@storybook/react';

// $FLOW_FIXME flow not liking the path here ( will look into this more)
import { createChapters } from 'stories/utils';
import Button from 'ui/components/Button';

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
    chapters: buttonTypes,
    children: 'Hello Button',
    createPropsMatrix,
  }),
});
