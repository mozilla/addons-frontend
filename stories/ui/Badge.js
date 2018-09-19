/* @flow */
import { storiesOf } from '@storybook/react';

import { createChapters } from 'stories/utils';
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

function createSections(type): Array<Props> {
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
    createSections,
    children: label,
    showChapterTitle: false,
  }),
});
