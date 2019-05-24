/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import IconRecommendedBadge from 'ui/components/IconRecommendedBadge';

const render = ({ size = 'large' } = {}) => {
  return <IconRecommendedBadge size={size} />;
};

storiesOf('IconRecommendedBadge', module).addWithChapters('all variants', {
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
