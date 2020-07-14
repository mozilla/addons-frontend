/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import IconPromotedBadge from 'ui/components/IconPromotedBadge';

// TODO: remove the comment below once
// https://github.com/yannickcr/eslint-plugin-react/issues/2298 is fixed.
// eslint-disable-next-line react/prop-types
const render = ({ category = 'line', size = 'large' } = {}) => {
  return <IconPromotedBadge category={category} size={size} />;
};

storiesOf('IconPromotedBadge', module).addWithChapters('all variants', {
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
