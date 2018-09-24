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

function createPropsMatrix(chapter) {
  return [
    {
      props: {
        buttonType: chapter,
      },
    },
    {
      props: {
        buttonType: chapter,
        disabled: true,
      },
    },
    {
      props: {
        buttonType: chapter,
        puffy: true,
      },
    },
    {
      props: {
        buttonType: chapter,
        puffy: true,
        disabled: true,
      },
    },
    {
      props: {
        buttonType: chapter,
        micro: true,
      },
    },
    {
      props: {
        buttonType: chapter,
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
    chapters: createChapters({
      Component: Button,
      chapters: buttonTypes,
      children: 'Hello Button',
      createPropsMatrix,
    }),
  });
