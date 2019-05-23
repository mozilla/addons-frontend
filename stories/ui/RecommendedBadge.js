/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { fakeI18n } from 'tests/unit/helpers';

import { RecommendedBadgeBase } from 'ui/components/RecommendedBadge';

storiesOf('RecommendedBadge', module).add('default', () => (
  <RecommendedBadgeBase
    size="large"
    i18n={fakeI18n({ includeJedSpy: false })}
  />
));
