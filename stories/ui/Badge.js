/* @flow */
import { storiesOf } from '@storybook/react';
// $FLOW_FIXME flow not liking the path here ( will look into this more)
import { createChapters } from 'stories/utils'; // eslint-disable-line import/no-unresolved

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
    chapters: types,
    children: label,
    createPropsMatrix,
    otherChapterProps: {
      title: undefined,
    },
  }),
});
