/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import Button from 'amo/components/Button';
import type { Props as ButtonProps } from 'amo/components/Button';

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
  ];
}

// $FlowIgnore: flow doesn't like module to be used in this way, let's not care about flow options here.
storiesOf('Button', module)
  .addParameters({
    component: Button,
  })
  .addDecorator((story) => <Provider story={story()} />)
  .addWithChapters('all variants', {
    chapters: createChapters({
      Component: Button,
      chapters: buttonTypes,
      children: 'Hello Button',
      createPropsMatrix,
    }),
  });
