/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import RecommendedBadge from 'ui/components/RecommendedBadge';

import Provider from '../setup/Provider';

storiesOf('RecommendedBadge', module)
  .addDecorator((story) => (
    <div className="RecommendedBadge--storybook">
      <Provider story={story()} />
    </div>
  ))
  .add('default', () => <RecommendedBadge />);
