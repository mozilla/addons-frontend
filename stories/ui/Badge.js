/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import Badge from 'ui/components/Badge';

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
  useTheme: true,
  chapters: [
    {
      sections: sections.map((section) => {
        return {
          subtitle: `type=${section.type}`,
          sectionFn: () => <Badge {...section} label={label} />,
        };
      }),
    },
  ],
});
