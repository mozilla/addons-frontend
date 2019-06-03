/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import IconRecommendedBadge from 'ui/components/IconRecommendedBadge';

// TODO: remove the comment below once
// https://github.com/yannickcr/eslint-plugin-react/issues/2298 is fixed.
// eslint-disable-next-line react/prop-types
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
