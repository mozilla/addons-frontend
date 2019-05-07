/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { fakeI18n } from 'tests/unit/helpers';

import RecommendedBadge from 'ui/components/RecommendedBadge';

storiesOf('RecommendedBadge', module).add('default', () => (
  <RecommendedBadge i18n={fakeI18n({ includeJedSpy: false })} />
));
