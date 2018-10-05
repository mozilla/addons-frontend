import * as React from 'react';

import Button from 'ui/components/Button';
import ConfirmButtonDialog, {
  ConfirmButtonDialogBase,
} from 'ui/components/ConfirmButtonDialog';
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
      <ConfirmButtonDialog {...props} />,
      ConfirmButtonDialogBase,
    );
  }

  it('renders a dialog', () => {
    const message = 'this action is risky, are you sure?';
    const root = render({ message });

    expect(root.find('.ConfirmButtonDialog-message')).toHaveLength(1);
    expect(root.find('.ConfirmButtonDialog-message')).toHaveText(message);

    expect(root.find(Button)).toHaveLength(2);

    const confirmButton = root.find(Button).at(0);
    expect(confirmButton).toHaveClassName('ConfirmButtonDialog-confirm-button');
    expect(confirmButton).toHaveProp('buttonType', 'alert');
    expect(confirmButton.children()).toHaveText('Confirm');

    const cancelButton = root.find(Button).at(1);
    expect(cancelButton).toHaveClassName('ConfirmButtonDialog-cancel-button');
    expect(cancelButton).toHaveProp('buttonType', 'cancel');
    expect(cancelButton.children()).toHaveText('Cancel');
  });

  it('renders a custom className', () => {
    const className = 'MyComponent';
    const root = render({ className });
    expect(root).toHaveClassName(className);
    expect(root).toHaveClassName('ConfirmButtonDialog');
  });

  it.each([true, false])(
    'can configure buttons as puffy=%s',
    (puffyButtons) => {
      const root = render({ puffyButtons });

      expect(root.find('.ConfirmButtonDialog-cancel-button')).toHaveProp(
        'puffy',
        puffyButtons,
      );
      expect(root.find('.ConfirmButtonDialog-confirm-button')).toHaveProp(
        'puffy',
        puffyButtons,
      );
    },
  );

  it('calls onConfirm() when user clicks Confirm', () => {
    const onConfirm = sinon.spy();
    const root = render({ onConfirm });

    const event = createFakeEvent();
    root.find('.ConfirmButtonDialog-confirm-button').simulate('click', event);

    sinon.assert.calledWith(onConfirm, event);
  });

  it('calls onCancel() when user clicks Cancel', () => {
    const onCancel = sinon.spy();
    const root = render({ onCancel });

    const event = createFakeEvent();
    root.find('.ConfirmButtonDialog-cancel-button').simulate('click', event);

    sinon.assert.calledWith(onCancel, event);
  });

  it('lets you configure the confirm button', () => {
    const confirmButtonText = 'Yes, do it!';
    const confirmButtonType = 'neutral';

    const root = render({ confirmButtonText, confirmButtonType });

    expect(root.find('.ConfirmButtonDialog-confirm-button')).toHaveProp(
      'buttonType',
      confirmButtonType,
    );
    expect(
      root.find('.ConfirmButtonDialog-confirm-button').children(),
    ).toHaveText(confirmButtonText);
  });

  it('lets you configure the cancel button', () => {
    const cancelButtonText = 'Nevermind, cancel';
    const cancelButtonType = 'neutral';
    const root = render({ cancelButtonText, cancelButtonType });

    expect(root.find('.ConfirmButtonDialog-cancel-button')).toHaveProp(
      'buttonType',
      cancelButtonType,
    );
    expect(
      root.find('.ConfirmButtonDialog-cancel-button').children(),
    ).toHaveText(cancelButtonText);
  });
});
