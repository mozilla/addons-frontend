import React from 'react';

import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { text, select } from '@storybook/addon-knobs';

import Badge from '../src/ui/components/Badge';

// TODO: look into showing flow props.

storiesOf('Badge', module).add(
	'options',
	withInfo(
		`Toggle the different options using "Knobs" (see right panel). Note: Since this component uses flow - setup to display proptypes is TBD.`,
	)(() => {
		const label = text('label', 'Hello Badge');

		const noType = 'noType';

		const typeOptions = {
			noType: 'no type',
			experimental: 'experimental',
			featured: 'featured',
			['restart-required']: 'restart-required',
			['not-compatible']: 'not-compatible',
			['requires-payment']: 'requires-payment',
		};

		const typeOption = select('type', typeOptions, noType, 'badgeType');

		return typeOption === noType ? (
			<Badge label={label} />
		) : (
			<Badge label={label} type={typeOption} />
		);
	}),
);
