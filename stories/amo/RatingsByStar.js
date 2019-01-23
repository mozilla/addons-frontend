/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import RatingsByStar from 'amo/components/RatingsByStar';
import type { Props as RatingProps } from 'amo/components/RatingsByStar';

import { createChapters } from '../utils';
import Provider from '../setup/Provider';

export type Props = {|
  props: RatingProps,
|};

function createPropsMatrix(): Array<Props> {
  return [
    {
      props: {
        addon: null,
      },
    },
  ];
}

storiesOf('RatingsByStar', module)
  .addDecorator((story) => <Provider story={story()} />)
  // TODO: props isn't working here because of translate HOC
  // I believe. We should look into this.
  // .add(
  //   'RatingsByStar props',
  //   withInfo()(() => {
  //     return <RatingsByStar />;
  //   }),
  // )
  .addWithChapters('RatingsByStar variations', {
    chapters: createChapters({
      Component: RatingsByStar,
      chapters: ['RatingsByStar'],
      createPropsMatrix,
      otherChapterProps: {
        // Since Badge has a simple props matrix we don't need to display
        // a title since there is only one item in each group (aka chapter).
        // TODO: maybe create separate createSections util helper.
        title: undefined,
      },
    }),
  });
