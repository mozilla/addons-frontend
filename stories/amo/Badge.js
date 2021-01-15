/* @flow */
import { storiesOf } from '@storybook/react';

import Badge from 'amo/components/Badge';
import type { Props as BadgeProps } from 'amo/components/Badge';

import { createChapters } from '../utils';

const label = 'Hello Badge';

const types = [
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
  .addParameters({
    component: Badge,
  })
  .addWithChapters('all variants', {
    chapters: createChapters({
      Component: Badge,
      chapters: types,
      children: label,
      createPropsMatrix,
      otherChapterProps: {
        // Since Badge has a simple props matrix we don't need to display
        // a title since there is only one item in each group (aka chapter).
        // TODO: maybe create separate createSections util helper.
        title: undefined,
      },
    }),
  });
