import React from 'react';
import { storiesOf } from '@storybook/react';

import Badge from 'ui/components/Badge';

storiesOf('Badge', module)
	.add('Badge (no type)', () => <Badge label="Hello Badge" />)
	.add('Badge experimental', () => (
		<Badge type="experimental" label="Hello Badge" />
	))
	.add('Badge featured', () => <Badge type="featured" label="Hello Badge" />)
	.add('Badge restart-required', () => (
		<Badge type="restart-required" label="Hello Badge" />
	))
	.add('Badge not-compatible', () => (
		<Badge type="not-compatible" label="Hello Badge" />
	))
	.add('Badge requires-payment', () => (
		<Badge type="requires-payment" label="Hello Badge" />
	));
