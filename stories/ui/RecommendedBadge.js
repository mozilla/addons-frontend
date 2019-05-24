/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { fakeI18n } from 'tests/unit/helpers';

import { RecommendedBadgeBase } from 'ui/components/RecommendedBadge';

const render = (moreProps = {}) => {
  const props = {
    size: 'large',
    ...moreProps,
  };
  return (
    <RecommendedBadgeBase
      i18n={fakeI18n({ includeJedSpy: false })}
      {...props}
    />
  );
};

storiesOf('RecommendedBadge', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'size="large"',
          sectionFn: () => render({ size: 'large' }),
        },
        {
          title: 'size="small"',
          sectionFn: () => render({ size: 'small' }),
        },
      ],
    },
  ],
});
