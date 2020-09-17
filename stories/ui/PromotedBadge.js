/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import PromotedBadge, { PromotedBadgeBase } from 'ui/components/PromotedBadge';
import type { Props as PromotedBadgeProps } from 'ui/components/PromotedBadge';

import Provider from '../setup/Provider';

const render = (moreProps: $Shape<PromotedBadgeProps> = {}) => {
  const props = {
    category: 'line',
    size: 'large',
    ...moreProps,
  };
  return <PromotedBadge {...props} />;
};

storiesOf('PromotedBadge', module)
  .addParameters({ component: PromotedBadgeBase })
  .addDecorator((story) => <Provider story={story()} />)
  .addWithChapters('all variants', {
    chapters: [
      {
        sections: [
          {
            title: 'category="line", size="large"',
            sectionFn: () => render({ size: 'large' }),
          },
          {
            title: 'category="line", size="small"',
            sectionFn: () => render({ size: 'small' }),
          },
          {
            title: 'category="recommended", size="large"',
            sectionFn: () => render({ category: 'recommended', size: 'large' }),
          },
          {
            title: 'category="recommended", size="small"',
            sectionFn: () => render({ category: 'recommended', size: 'small' }),
          },
          {
            title: 'category="verified", size="large"',
            sectionFn: () => render({ category: 'verified', size: 'large' }),
          },
          {
            title: 'category="verified", size="small"',
            sectionFn: () => render({ category: 'verified', size: 'small' }),
          },
        ],
      },
    ],
  });
