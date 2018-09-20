/* @flow */
import { storiesOf } from '@storybook/react';

import { createChapters, createSimpleSections } from 'stories/utils';
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

type Props = {|
  props: BadgeProps,
|};

function createPropsMatrix(type): Array<Props> {
  return [
    {
      props: {
        type,
        label,
      },
    },
  ];
}

storiesOf('Badge', module).addWithChapters('Badge variations', {
  chapters: createChapters({
    Component: Badge,
    sections: types,
    createPropsMatrix,
    children: label,
    showChapterTitle: false,
  }),
});
