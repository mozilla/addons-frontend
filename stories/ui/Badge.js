/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import Badge from 'ui/components/Badge';

const label = 'Hello Badge';

storiesOf('Badge', module)
  .add('default (no type)', () => <Badge label={label} />)
  .add('experimental type', () => <Badge type="experimental" label={label} />)
  .add('featured type', () => <Badge type="featured" label={label} />)
  .add('restart-required type', () => (
    <Badge type="restart-required" label={label} />
  ))
  .add('not-compatible type', () => (
    <Badge type="not-compatible" label={label} />
  ))
  .add('requires-payment type', () => (
    <Badge type="requires-payment" label={label} />
  ));
