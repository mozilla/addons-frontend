/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import IconStar from 'ui/components/IconStar';
import type { Props as IconStarProps } from 'ui/components/IconStar';

import { createChapters } from '../utils';

export type Props = {|
  props: IconStarProps,
|};

function createPropsMatrix(): Array<Props> {
  return [
    {
      props: {
        half: false,
        selected: false,
        readOnly: false,
        yellow: true,
      },
    },
    {
      props: {
        half: false,
        selected: false,
        readOnly: true,
        yellow: true,
      },
    },
    {
      props: {
        half: false,
        selected: true,
        readOnly: true,
        yellow: true,
      },
    },
    {
      props: {
        half: false,
        selected: true,
        readOnly: false,
        yellow: true,
      },
    },
    {
      props: {
        half: true,
        selected: true,
        readOnly: true,
        yellow: true,
      },
    },
    {
      props: {
        half: true,
        selected: true,
        readOnly: false,
        yellow: true,
      },
    },
    {
      props: {
        half: true,
        selected: false,
        readOnly: false,
        yellow: true,
      },
    },
    {
      props: {
        half: false,
        selected: false,
        readOnly: false,
        yellow: false,
      },
    },
    {
      props: {
        half: false,
        selected: false,
        readOnly: true,
        yellow: false,
      },
    },
    {
      props: {
        half: false,
        selected: true,
        readOnly: true,
        yellow: false,
      },
    },
    {
      props: {
        half: false,
        selected: true,
        readOnly: false,
        yellow: false,
      },
    },
    {
      props: {
        half: true,
        selected: true,
        readOnly: true,
        yellow: false,
      },
    },
    {
      props: {
        half: true,
        selected: true,
        readOnly: false,
        yellow: false,
      },
    },
    {
      props: {
        half: true,
        selected: false,
        readOnly: false,
        yellow: false,
      },
    },
  ];
}

storiesOf('IconStar', module)
  .add(
    'IconStar props',
    withInfo()(() => {
      return <IconStar />;
    }),
  )
  .addWithChapters('IconStar variations', {
    chapters: createChapters({
      Component: IconStar,
      chapters: ['IconStar'],
      createPropsMatrix,
      otherChapterProps: {
        // Since Badge has a simple props matrix we don't need to display
        // a title since there is only one item in each group (aka chapter).
        // TODO: maybe create separate createSections util helper.
        title: undefined,
      },
    }),
  });
