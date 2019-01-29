/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import Rating from 'ui/components/Rating';
import type { Props as RatingProps } from 'ui/components/Rating';

import { createChapters } from '../utils';
import Provider from '../setup/Provider';


export type Props = {|
  props: RatingProps,
|};

function createPropsMatrix(): Array<Props> {
  return [
    {
      props: {
        readOnly: false,
        styleSize: 'small',
        rating: 4,
        yellowStars: true,
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'small',
        rating: 3.5,
        yellowStars: true,
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'small',
        rating: 4,
        yellowStars: true,
      },
    },
    {
      props: {
        readOnly: false,
        styleSize: 'large',
        rating: null,
        yellowStars: true,
        className: 'RatingManager-UserRating',
      },
    },
    {
      props: {
        readOnly: false,
        styleSize: 'large',
        rating: 3,
        yellowStars: true,
        className: 'RatingManager-UserRating',
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'large',
        rating: 3.5,
        yellowStars: true,
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'large',
        rating: 4,
        yellowStars: true,
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'small',
        rating: null,
        yellowStars: false,
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'small',
        rating: 3.5,
        yellowStars: false,
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'small',
        rating: 4,
        yellowStars: false,
      },
    },
    {
      props: {
        readOnly: true,
        styleSize: 'large',
        rating: null,
        yellowStars: false,
        className: 'RatingManager-UserRating',
      },
    },
  ];
}

storiesOf('Rating', module)
  .addDecorator((story) => (
    <div className="Rating--storybook">
      <Provider story={story()} />
    </div>
  ))
  // TODO: props isn't working here because of translate HOC
  // I believe. We should look into this.
  // .add(
  //   'Rating props',
  //   withInfo()(() => {
  //     return <Rating />;
  //   }),
  // )
  .addWithChapters('Rating variations', {
    chapters: createChapters({
      Component: Rating,
      chapters: ['Rating'],
      createPropsMatrix,
      otherChapterProps: {
        // Since Rating has a simple props matrix we don't need to display
        // a title since there is only one item in each group (aka chapter).
        // TODO: maybe create separate createSections util helper.
        title: undefined,
      },
    }),
  });
