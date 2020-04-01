/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import Button from 'ui/components/Button';
import type { Props as ButtonProps } from 'ui/components/Button';

import Provider from '../setup/Provider';
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
  'readmore',
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
        href: 'http://www.example.com',
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        externalDark: true,
        micro: true,
        href: 'http://www.example.com',
      },
    },
    {
      props: {
        ...Button.defaultProps,
        buttonType: chapter,
        puffy: true,
      },
    },
  ];
}

storiesOf('Button', module)
  .addDecorator((story) => <Provider story={story()} />)
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
