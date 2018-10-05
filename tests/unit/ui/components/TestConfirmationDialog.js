import * as React from 'react';

import Button from 'ui/components/Button';
import ConfirmationDialog, {
  ConfirmationDialogBase,
} from 'ui/components/ConfirmationDialog';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render(otherProps = {}) {
    const props = {
      i18n: fakeI18n(),
      onCancel: sinon.stub(),
      onConfirm: sinon.stub(),
      ...otherProps,
    };
    return shallowUntilTarget(
      <ConfirmationDialog {...props} />,
      ConfirmationDialogBase,
    );
  }

  it('renders a dialog', () => {
    const message = 'this action is risky, are you sure?';
    const root = render({ message });

    expect(root.find('.ConfirmationDialog-message')).toHaveLength(1);
    expect(root.find('.ConfirmationDialog-message')).toHaveText(message);

    expect(root.find(Button)).toHaveLength(2);

    const confirmButton = root.find(Button).at(0);
    expect(confirmButton).toHaveClassName('ConfirmationDialog-confirm-button');
    expect(confirmButton).toHaveProp('buttonType', 'alert');
    expect(confirmButton.children()).toHaveText('Confirm');

    const cancelButton = root.find(Button).at(1);
    expect(cancelButton).toHaveClassName('ConfirmationDialog-cancel-button');
    expect(cancelButton).toHaveProp('buttonType', 'cancel');
    expect(cancelButton.children()).toHaveText('Cancel');
  });

  it('renders a custom className', () => {
    const className = 'MyComponent';
    const root = render({ className });
    expect(root).toHaveClassName(className);
    expect(root).toHaveClassName('ConfirmationDialog');
  });

  it.each([true, false])(
    'can configure buttons as puffy=%s',
    (puffyButtons) => {
      const root = render({ puffyButtons });

      expect(root.find('.ConfirmationDialog-cancel-button')).toHaveProp(
        'puffy',
        puffyButtons,
      );
      expect(root.find('.ConfirmationDialog-confirm-button')).toHaveProp(
        'puffy',
        puffyButtons,
      );
    },
  );

  it('calls onConfirm() when user clicks Confirm', () => {
    const onConfirm = sinon.spy();
    const root = render({ onConfirm });

    const event = createFakeEvent();
    root.find('.ConfirmationDialog-confirm-button').simulate('click', event);

    sinon.assert.calledWith(onConfirm, event);
  });

  it('calls onCancel() when user clicks Cancel', () => {
    const onCancel = sinon.spy();
    const root = render({ onCancel });

    const event = createFakeEvent();
    root.find('.ConfirmationDialog-cancel-button').simulate('click', event);

    sinon.assert.calledWith(onCancel, event);
  });

  it('lets you configure the confirm button', () => {
    const confirmButtonText = 'Yes, do it!';
    const confirmButtonType = 'neutral';

    const root = render({ confirmButtonText, confirmButtonType });

    expect(root.find('.ConfirmationDialog-confirm-button')).toHaveProp(
      'buttonType',
      confirmButtonType,
    );
    expect(
      root.find('.ConfirmationDialog-confirm-button').children(),
    ).toHaveText(confirmButtonText);
  });

  it('lets you configure the cancel button', () => {
    const cancelButtonText = 'Nevermind, cancel';
    const cancelButtonType = 'neutral';
    const root = render({ cancelButtonText, cancelButtonType });

    expect(root.find('.ConfirmationDialog-cancel-button')).toHaveProp(
      'buttonType',
      cancelButtonType,
    );
    expect(
      root.find('.ConfirmationDialog-cancel-button').children(),
    ).toHaveText(cancelButtonText);
  });
});
