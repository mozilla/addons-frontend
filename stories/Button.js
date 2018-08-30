import React from 'react';
import { storiesOf } from '@storybook/react';

import Button from 'ui/components/Button';

const label = 'Hello Button';

storiesOf('Button', module)
	.add('buttonType (none is default)', () => <Button>{label}</Button>)
	.add('buttonType (none is default) disabled', () => (
		<Button disabled>{label}</Button>
	))
	.add('buttonType neutral', () => (
		<Button buttonType="neutral">{label}</Button>
	))
	.add('buttonType neutral disabled', () => (
		<Button buttonType="neutral" disabled>
			{label}
		</Button>
	))
	.add('buttonType neutral puffy', () => (
		<Button buttonType="neutral" puffy>
			{label}
		</Button>
	))
	.add('buttonType neutral puffy disabled', () => (
		<Button buttonType="neutral" puffy disabled>
			{label}
		</Button>
	))
	.add('buttonType neutral micro', () => (
		<Button buttonType="neutral" micro>
			{label}
		</Button>
	))
	.add('buttonType neutral micro disabled', () => (
		<Button buttonType="neutral" micro disabled>
			{label}
		</Button>
	))
	.add('buttonType alert', () => <Button buttonType="alert">{label}</Button>)
	.add('buttonType alert disabled', () => (
		<Button buttonType="alert" disabled>
			{label}
		</Button>
	))
	.add('buttonType alert puffy', () => (
		<Button buttonType="alert" puffy>
			{label}
		</Button>
	))
	.add('buttonType alert puffy disabled', () => (
		<Button buttonType="alert" puffy disabled>
			{label}
		</Button>
	))
	.add('buttonType alert micro', () => (
		<Button buttonType="alert" micro>
			{label}
		</Button>
	))
	.add('buttonType alert micro disabled', () => (
		<Button buttonType="alert" micro disabled>
			{label}
		</Button>
	))
	.add('buttonType light', () => <Button buttonType="light">{label}</Button>)
	.add('buttonType light disabled', () => (
		<Button buttonType="light" disabled>
			{label}
		</Button>
	))
	.add('buttonType light puffy', () => (
		<Button buttonType="light" puffy>
			{label}
		</Button>
	))
	.add('buttonType light puffy disabled', () => (
		<Button buttonType="light" puffy disabled>
			{label}
		</Button>
	))
	.add('buttonType light micro', () => (
		<Button buttonType="light" micro>
			{label}
		</Button>
	))
	.add('buttonType light micro disabled', () => (
		<Button buttonType="light" micro disabled>
			{label}
		</Button>
	))
	.add('buttonType action', () => <Button buttonType="action">{label}</Button>)
	.add('buttonType action disabled', () => (
		<Button buttonType="action" disabled>
			{label}
		</Button>
	))
	.add('buttonType action puffy', () => (
		<Button buttonType="action" puffy>
			{label}
		</Button>
	))
	.add('buttonType action puffy disabled', () => (
		<Button buttonType="action" puffy disabled>
			{label}
		</Button>
	))
	.add('buttonType action micro', () => (
		<Button buttonType="action" micro>
			{label}
		</Button>
	))
	.add('buttonType action micro disabled', () => (
		<Button buttonType="action" micro disabled>
			{label}
		</Button>
	))
	.add('buttonType cancel', () => <Button buttonType="cancel">{label}</Button>)
	.add('buttonType cancel disabled', () => (
		<Button buttonType="cancel" disabled>
			{label}
		</Button>
	))
	.add('buttonType cancel puffy', () => (
		<Button buttonType="cancel" puffy>
			{label}
		</Button>
	))
	.add('buttonType cancel puffy disabled', () => (
		<Button buttonType="cancel" puffy disabled>
			{label}
		</Button>
	))
	.add('buttonType cancel micro', () => (
		<Button buttonType="cancel" micro>
			{label}
		</Button>
	))
	.add('buttonType cancel micro disabled', () => (
		<Button buttonType="cancel" micro disabled>
			{label}
		</Button>
	))
	.add('buttonType confirm', () => (
		<Button buttonType="confirm">{label}</Button>
	))
	.add('buttonType confirm disabled', () => (
		<Button buttonType="confirm" disabled>
			{label}
		</Button>
	))
	.add('buttonType confirm puffy', () => (
		<Button buttonType="confirm" puffy>
			{label}
		</Button>
	))
	.add('buttonType confirm puffy disabled', () => (
		<Button buttonType="confirm" puffy disabled>
			{label}
		</Button>
	))
	.add('buttonType confirm micro', () => (
		<Button buttonType="confirm" micro>
			{label}
		</Button>
	))
	.add('buttonType confirm micro disabled', () => (
		<Button buttonType="confirm" micro disabled>
			{label}
		</Button>
	));
