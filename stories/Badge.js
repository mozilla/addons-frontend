import React from 'react';
import { storiesOf } from '@storybook/react';

import Badge from 'ui/components/Badge';

const label = 'Hello Badge';

storiesOf('Badge', module)
	.add('Badge (no type)', () => <Badge label={label} />)
	.add('Badge experimental', () => <Badge type="experimental" label={label} />)
	.add('Badge featured', () => <Badge type="featured" label={label} />)
	.add('Badge restart-required', () => (
		<Badge type="restart-required" label={label} />
	))
	.add('Badge not-compatible', () => (
		<Badge type="not-compatible" label={label} />
	))
	.add('Badge requires-payment', () => (
		<Badge type="requires-payment" label={label} />
	));
