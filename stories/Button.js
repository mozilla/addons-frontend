import React from 'react';
import { storiesOf } from '@storybook/react';

import Button from 'ui/components/Button';

storiesOf('Button', module)
	.add('buttonType (none is default)', () => <Button>Hello Button</Button>)
	.add('buttonType (none is default) disabled', () => (
		<Button disabled>Hello Button</Button>
	))
	.add('buttonType neutral', () => (
		<Button buttonType="neutral">Hello Button</Button>
	))
	.add('buttonType neutral disabled', () => (
		<Button buttonType="neutral" disabled>
			Hello Button
		</Button>
	))
	.add('buttonType neutral puffy', () => (
		<Button buttonType="neutral" puffy>
			Hello Button
		</Button>
	))
	.add('buttonType neutral puffy disabled', () => (
		<Button buttonType="neutral" puffy disabled>
			Hello Button
		</Button>
	))
	.add('buttonType neutral micro', () => (
		<Button buttonType="neutral" micro>
			Hello Button
		</Button>
	))
	.add('buttonType neutral micro disabled', () => (
		<Button buttonType="neutral" micro disabled>
			Hello Button
		</Button>
	))
	.add('buttonType alert', () => (
		<Button buttonType="alert">Hello Button</Button>
	))
	.add('buttonType alert disabled', () => (
		<Button buttonType="alert" disabled>
			Hello Button
		</Button>
	))
	.add('buttonType alert puffy', () => (
		<Button buttonType="alert" puffy>
			Hello Button
		</Button>
	))
	.add('buttonType alert puffy disabled', () => (
		<Button buttonType="alert" puffy disabled>
			Hello Button
		</Button>
	))
	.add('buttonType alert micro', () => (
		<Button buttonType="alert" micro>
			Hello Button
		</Button>
	))
	.add('buttonType alert micro disabled', () => (
		<Button buttonType="alert" micro disabled>
			Hello Button
		</Button>
	))
	.add('buttonType light', () => (
		<Button buttonType="light">Hello Button</Button>
	))
	.add('buttonType light disabled', () => (
		<Button buttonType="light" disabled>
			Hello Button
		</Button>
	))
	.add('buttonType light puffy', () => (
		<Button buttonType="light" puffy>
			Hello Button
		</Button>
	))
	.add('buttonType light puffy disabled', () => (
		<Button buttonType="light" puffy disabled>
			Hello Button
		</Button>
	))
	.add('buttonType light micro', () => (
		<Button buttonType="light" micro>
			Hello Button
		</Button>
	))
	.add('buttonType light micro disabled', () => (
		<Button buttonType="light" micro disabled>
			Hello Button
		</Button>
	))
	.add('buttonType action', () => (
		<Button buttonType="action">Hello Button</Button>
	))
	.add('buttonType action disabled', () => (
		<Button buttonType="action" disabled>
			Hello Button
		</Button>
	))
	.add('buttonType action puffy', () => (
		<Button buttonType="action" puffy>
			Hello Button
		</Button>
	))
	.add('buttonType action puffy disabled', () => (
		<Button buttonType="action" puffy disabled>
			Hello Button
		</Button>
	))
	.add('buttonType action micro', () => (
		<Button buttonType="action" micro>
			Hello Button
		</Button>
	))
	.add('buttonType action micro disabled', () => (
		<Button buttonType="action" micro disabled>
			Hello Button
		</Button>
	))
	.add('buttonType cancel', () => (
		<Button buttonType="cancel">Hello Button</Button>
	))
	.add('buttonType cancel disabled', () => (
		<Button buttonType="cancel" disabled>
			Hello Button
		</Button>
	))
	.add('buttonType cancel puffy', () => (
		<Button buttonType="cancel" puffy>
			Hello Button
		</Button>
	))
	.add('buttonType cancel puffy disabled', () => (
		<Button buttonType="cancel" puffy disabled>
			Hello Button
		</Button>
	))
	.add('buttonType cancel micro', () => (
		<Button buttonType="cancel" micro>
			Hello Button
		</Button>
	))
	.add('buttonType cancel micro disabled', () => (
		<Button buttonType="cancel" micro disabled>
			Hello Button
		</Button>
	))
	.add('buttonType confirm', () => (
		<Button buttonType="confirm">Hello Button</Button>
	))
	.add('buttonType confirm disabled', () => (
		<Button buttonType="confirm" disabled>
			Hello Button
		</Button>
	))
	.add('buttonType confirm puffy', () => (
		<Button buttonType="confirm" puffy>
			Hello Button
		</Button>
	))
	.add('buttonType confirm puffy disabled', () => (
		<Button buttonType="confirm" puffy disabled>
			Hello Button
		</Button>
	))
	.add('buttonType confirm micro', () => (
		<Button buttonType="confirm" micro>
			Hello Button
		</Button>
	))
	.add('buttonType confirm micro disabled', () => (
		<Button buttonType="confirm" micro disabled>
			Hello Button
		</Button>
	));
