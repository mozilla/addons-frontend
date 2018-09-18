/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import Badge from 'ui/components/Badge';
import type { Props as BadgeProps } from 'ui/components/Badge';

const label = 'Hello Badge';

const sections = [
  {
    type: 'featured',
  },
  {
    type: 'experimental',
  },
  {
    type: 'restart-required',
  },
  {
    type: 'not-compatible',
  },
  {
    type: 'requires-payment',
  },
];

storiesOf('Badge', module).addWithChapters('Badge variations', {
  chapters: [
    {
      sections: sections.map((section) => {
        const props: BadgeProps = { label, ...section };
        return {
          subtitle: `type=${section.type}`,
          sectionFn: () => <Badge {...props} />,
        };
      }),
    },
  ],
});
