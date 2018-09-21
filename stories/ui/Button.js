/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

// $FLOW_FIXME flow not liking the path here ( will look into this more)
import { createChapters } from 'utils';
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

storiesOf('Button', module)
  .add(
    'Button props',
    withInfo()(() => {
      return <Button />;
    }),
  )
  .addWithChapters('Button variations', {
    chapters: [
      ...createChapters({
        Component: Button,
        chapters: buttonTypes,
        children: 'Hello Button',
        createPropsMatrix,
      }),
    ],
  });
