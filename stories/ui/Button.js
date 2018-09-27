/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';

import Button from 'ui/components/Button';

const label = 'Hello Button';

storiesOf('Button', module)
  .add('default (no buttonType)', () => <Button>{label}</Button>)
  .add('default (no buttonType), disabled', () => (
    <Button disabled>{label}</Button>
  ))
  .add('default (no buttonType), puffy', () => <Button puffy>{label}</Button>)
  .add('default (no buttonType), puffy, disabled', () => (
    <Button puffy disabled>
      {label}
    </Button>
  ))
  .add('default (no buttonType), micro', () => <Button micro>{label}</Button>)
  .add('default (no buttonType), micro, disabled', () => (
    <Button micro disabled>
      {label}
    </Button>
  ))
  .add('neutral buttonType', () => (
    <Button buttonType="neutral">{label}</Button>
  ))
  .add('neutral buttonType, disabled', () => (
    <Button buttonType="neutral" disabled>
      {label}
    </Button>
  ))
  .add('neutral buttonType, puffy', () => (
    <Button buttonType="neutral" puffy>
      {label}
    </Button>
  ))
  .add('neutral buttonType, puffy, disabled', () => (
    <Button buttonType="neutral" puffy disabled>
      {label}
    </Button>
  ))
  .add('neutral buttonType, micro', () => (
    <Button buttonType="neutral" micro>
      {label}
    </Button>
  ))
  .add('neutral buttonType, micro, disabled', () => (
    <Button buttonType="neutral" micro disabled>
      {label}
    </Button>
  ))
  .add('alert buttonType', () => <Button buttonType="alert">{label}</Button>)
  .add('alert buttonType, disabled', () => (
    <Button buttonType="alert" disabled>
      {label}
    </Button>
  ))
  .add('alert buttonType, puffy', () => (
    <Button buttonType="alert" puffy>
      {label}
    </Button>
  ))
  .add('alert buttonType, puffy, disabled', () => (
    <Button buttonType="alert" puffy disabled>
      {label}
    </Button>
  ))
  .add('alert buttonType, micro', () => (
    <Button buttonType="alert" micro>
      {label}
    </Button>
  ))
  .add('alert buttonType, micro, disabled', () => (
    <Button buttonType="alert" micro disabled>
      {label}
    </Button>
  ))
  .add('light buttonType', () => <Button buttonType="light">{label}</Button>)
  .add('light buttonType, disabled', () => (
    <Button buttonType="light" disabled>
      {label}
    </Button>
  ))
  .add('light buttonType, puffy', () => (
    <Button buttonType="light" puffy>
      {label}
    </Button>
  ))
  .add('light buttonType, puffy, disabled', () => (
    <Button buttonType="light" puffy disabled>
      {label}
    </Button>
  ))
  .add('light buttonType, micro', () => (
    <Button buttonType="light" micro>
      {label}
    </Button>
  ))
  .add('light buttonType, micro, disabled', () => (
    <Button buttonType="light" micro disabled>
      {label}
    </Button>
  ))
  .add('action buttonType', () => <Button buttonType="action">{label}</Button>)
  .add('action buttonType, disabled', () => (
    <Button buttonType="action" disabled>
      {label}
    </Button>
  ))
  .add('action buttonType, puffy', () => (
    <Button buttonType="action" puffy>
      {label}
    </Button>
  ))
  .add('action buttonType, puffy, disabled', () => (
    <Button buttonType="action" puffy disabled>
      {label}
    </Button>
  ))
  .add('action buttonType, micro', () => (
    <Button buttonType="action" micro>
      {label}
    </Button>
  ))
  .add('action buttonType, micro, disabled', () => (
    <Button buttonType="action" micro disabled>
      {label}
    </Button>
  ))
  .add('cancel buttonType', () => <Button buttonType="cancel">{label}</Button>)
  .add('cancel buttonType, disabled', () => (
    <Button buttonType="cancel" disabled>
      {label}
    </Button>
  ))
  .add('cancel buttonType, puffy', () => (
    <Button buttonType="cancel" puffy>
      {label}
    </Button>
  ))
  .add('cancel buttonType, puffy, disabled', () => (
    <Button buttonType="cancel" puffy disabled>
      {label}
    </Button>
  ))
  .add('cancel buttonType, micro', () => (
    <Button buttonType="cancel" micro>
      {label}
    </Button>
  ))
  .add('cancel buttonType, micro, disabled', () => (
    <Button buttonType="cancel" micro disabled>
      {label}
    </Button>
  ))
  .add('confirm buttonType', () => (
    <Button buttonType="confirm">{label}</Button>
  ))
  .add('confirm buttonType, disabled', () => (
    <Button buttonType="confirm" disabled>
      {label}
    </Button>
  ))
  .add('confirm buttonType, puffy', () => (
    <Button buttonType="confirm" puffy>
      {label}
    </Button>
  ))
  .add('confirm buttonType, puffy, disabled', () => (
    <Button buttonType="confirm" puffy disabled>
      {label}
    </Button>
  ))
  .add('confirm buttonType, micro', () => (
    <Button buttonType="confirm" micro>
      {label}
    </Button>
  ))
  .add('confirm buttonType, micro, disabled', () => (
    <Button buttonType="confirm" micro disabled>
      {label}
    </Button>
  ));
