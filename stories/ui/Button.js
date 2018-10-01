/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import Button from 'ui/components/Button';
import type { Props as ButtonProps } from 'ui/components/Button';

import { createChapters } from '../utils';

export type Props = {|
  props: ButtonProps,
|};

const buttonTypes = [
  'none',
  'neutral',
  'alert',
  'light',
  'action',
  'cancel',
  'confirm',
];

function createPropsMatrix(chapter): Array<Props> {
  return [
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        disabled: true,
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        puffy: true,
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        puffy: true,
        disabled: true,
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        micro: true,
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        micro: true,
        disabled: true,
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        externalDark: true,
        puffy: true,
        // TODO: We need to have a little bit more set up for externalDark with href.
        // The following will help get started with this ~:
        // See https://github.com/mozilla/addons-frontend/pull/6389/files.
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
