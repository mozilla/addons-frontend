/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import IconPromotedBadge, {
  IconPromotedBadgeBase,
} from 'amo/components/IconPromotedBadge';

import Provider from '../setup/Provider';

const render = ({ category = 'line', size = 'large' } = {}) => {
  return <IconPromotedBadge category={category} size={size} />;
};

// $FlowIgnore: flow doesn't like module to be used in this way, let's not care about flow options here.
storiesOf('IconPromotedBadge', module)
  .addParameters({
    component: IconPromotedBadgeBase,
  })
  .addDecorator((story) => <Provider story={story()} />)
  .addWithChapters('all variants', {
    chapters: [
      {
        sections: [
          {
            title: 'Line, size="large"',
            sectionFn: () => render({ size: 'large' }),
          },
          {
            title: 'Line, size="small"',
            sectionFn: () => render({ size: 'small' }),
          },
          {
            title: 'Recommended, size="large"',
            sectionFn: () => render({ category: 'recommended', size: 'large' }),
          },
          {
            title: 'Recommended, size="small"',
            sectionFn: () => render({ category: 'recommended', size: 'small' }),
          },
          {
            title: 'Verified, size="large"',
            sectionFn: () => render({ category: 'verified', size: 'large' }),
          },
          {
            title: 'Verified, size="small"',
            sectionFn: () => render({ category: 'verified', size: 'small' }),
          },
        ],
      },
    ],
  });
