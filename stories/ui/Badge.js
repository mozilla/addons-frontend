/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

// $FLOW_FIXME flow not liking the path here ( will look into this more)
import { createChapters } from 'utils';
import Badge from 'ui/components/Badge';
import type { Props as BadgeProps } from 'ui/components/Badge';

const label = 'Hello Badge';

const types = [
  'featured',
  'experimental',
  'restart-required',
  'not-compatible',
  'requires-payment',
];

export type Props = {|
  props: BadgeProps,
|};

function createPropsMatrix(chapter): Array<Props> {
  return [
    {
      props: {
        type: chapter,
        label,
      },
    },
  ];
}

storiesOf('Badge', module)
  .add(
    'Badge props',
    withInfo()(() => {
      return <Badge label="" />;
    }),
  )
  .addWithChapters('Badge variations', {
    chapters: [
      ...createChapters({
        Component: Badge,
        chapters: types,
        children: label,
        createPropsMatrix,
        otherChapterProps: {
          title: undefined,
        },
      }),
    ],
  });
