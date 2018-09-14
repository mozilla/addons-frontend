import React from 'react';
import { storiesOf } from '@storybook/react';

import Button from 'ui/components/Button';

const label = 'Hello Button';
const buttonTypes = [
	undefined,
	'neutral',
	'alert',
	'light',
	'action',
	'cancel',
	'confirm',
];

function createSections(buttonType) {
	return [
		{
			description: `${buttonType || 'default (no buttonType)'}`,
			props: {
				buttonType,
			},
		},
		{
			description: 'disabled=true',
			props: {
				buttonType,
				disabled: true,
			},
		},
		{
			description: 'puffy=true',
			props: {
				buttonType,
				puffy: true,
			},
		},
		{
			description: 'puffy=true, disabled=true',
			props: {
				buttonType,
				puffy: true,
				disabled: true,
			},
		},
		{
			description: 'micro=true',
			props: {
				buttonType,
				micro: true,
			},
		},
		{
			description: 'micro=true, disabled=true',
			props: {
				buttonType,
				micro: true,
				disabled: true,
			},
		},
	];
}

function createChapters() {
	return buttonTypes.map((type) => {
		return {
			title: type,
			sections: createSections(type).map((section) => {
				return {
					subtitle: `${section.description}`,
					sectionFn: () => <Button {...section.props}>{label}</Button>,
				};
			}),
		};
	});
}

storiesOf('Button').addWithChapters('Button variations', {
	useTheme: false,
	chapters: createChapters(),
});
