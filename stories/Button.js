import React from 'react';
import { MemoryRouter } from 'react-router';

import { storiesOf, addDecorator } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';
import { withInfo } from '@storybook/addon-info';
import { text, boolean, select } from '@storybook/addon-knobs';

import Provider from './setup/Provider';
import Button from 'ui/components/Button';

storiesOf('Button', module)
	.addDecorator((story) => <Provider story={story()} />)
	.addDecorator((story) => (
		<MemoryRouter initialEntries={['/']}>{story()}</MemoryRouter>
	))
	.add(
		'options',
		withInfo(
			`Toggle the different button options using "Knobs" (see right panel).
			Note with the default buttonType (none), you won't see much difference.`,
		)(() => {
			const label = text('Label', 'Hello Button');

			const btnTypeOptions = {
				neutral: 'neutral',
				light: 'light',
				action: 'action',
				cancel: 'cancel',
				confirm: 'confirm',
				alert: 'alert',
				none: 'none',
			};

			const buttonType = select(
				'buttonType',
				btnTypeOptions,
				'none',
				'buttonTypes',
			);

			let puffyDefault = false;
			let microDefault = false;

			let isPuffy = boolean('puffy', puffyDefault, true);
			let isMicro = boolean('micro', microDefault, true);

			const isDisabled = boolean('Disabled', false, true);

			const noLink = boolean('noLink', false, true);

			const href = text('href', '');
			const to = text('to', '');

			let linkProps;

			if (href) {
				linkProps = {
					href,
					to: undefined,
				};
			}

			if (to) {
				linkProps = {
					href: undefined,
					to,
				};
			}

			if (noLink) {
				linkProps = {
					href: undefined,
					to: undefined,
				};
			}

			return (
				<Button
					buttonType={buttonType}
					disabled={isDisabled}
					noLink={noLink}
					micro={isMicro}
					puffy={isPuffy}
					{...linkProps}
				>
					{label}
				</Button>
			);
		}),
	);
