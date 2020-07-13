/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import { fakeI18n } from 'tests/unit/helpers';
import { PromotedBadgeBase } from 'ui/components/PromotedBadge';
import type { InternalProps as PromotedBadgeProps } from 'ui/components/PromotedBadge';

const render = (moreProps: $Shape<PromotedBadgeProps> = {}) => {
  const props = {
    category: 'line',
    size: 'large',
    ...moreProps,
  };
  return (
    <PromotedBadgeBase i18n={fakeI18n({ includeJedSpy: false })} {...props} />
  );
};

storiesOf('PromotedBadge', module).addWithChapters('all variants', {
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
        {
          title: 'size="large" sponsor',
          sectionFn: () =>
            render({ category: 'verified', size: 'large', sponsor: true }),
        },
        {
          title: 'category="verified", size="small" sponsor',
          sectionFn: () =>
            render({ category: 'verified', size: 'small', sponsor: true }),
        },
      ],
    },
  ],
});
