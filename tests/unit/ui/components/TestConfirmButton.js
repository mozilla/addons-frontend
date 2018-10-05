import * as React from 'react';

import Button from 'ui/components/Button';
import ConfirmButton, {
  ConfirmButtonBase,
  extractId,
} from 'ui/components/ConfirmButton';
import ConfirmationDialog from 'ui/components/ConfirmationDialog';
import {
  applyUIStateChanges,
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const getProps = ({ i18n = fakeI18n(), ...props } = {}) => {
    return {
      i18n,
      id: 'Collection-confirm-delete',
      message: 'some warning message',
      onConfirm: sinon.stub(),
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  const render = ({ children, ...otherProps } = {}) => {
    return shallowUntilTarget(
      <ConfirmButton {...getProps(otherProps)}>
        {children || 'the default text of this button'}
      </ConfirmButton>,
      ConfirmButtonBase,
    );
  };

  const renderWithDialog = ({
    store = dispatchClientMetadata().store,
    ...otherProps
  } = {}) => {
    const root = render({ store, ...otherProps });

    // Click to open ConfirmationDialog.
    root.find(Button).simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root.find(ConfirmationDialog)).toHaveLength(1);

    return root;
  };

  const getDialogProp = (root, propName) => {
    const confirmDialog = root.find(ConfirmationDialog);
    expect(confirmDialog).toHaveProp(propName);
    return confirmDialog.prop(propName);
  };

  it('renders a button', () => {
    const root = render();

    expect(root).toHaveClassName('ConfirmButton');
    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveClassName('ConfirmButton-default-button');
    expect(root.find(Button)).toHaveProp('buttonType', 'neutral');
  });

  it('passes the buttonType prop to the button', () => {
    const buttonType = 'alert';
    const root = render({ buttonType });

    expect(root.find(Button)).toHaveProp('buttonType', buttonType);
  });

  it('passes the children prop to the button', () => {
    const children = 'Do you really want to delete this?';
    const root = render({ children });

    expect(root.find(Button).children()).toHaveText(children);
  });

  it('shows ConfirmationDialog when button is clicked', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');
    expect(root.find(ConfirmationDialog)).toHaveLength(0);

    root.find(Button).simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('ConfirmButton--show-confirmation');
    expect(root.find(ConfirmationDialog)).toHaveLength(1);
  });

  it('configures ConfirmationDialog', () => {
    const cancelButtonText = 'Nevermind, take me back';
    const cancelButtonType = 'alert';
    const confirmButtonText = 'Do it!';
    const confirmButtonType = 'alert';
    const message = 'Do you really want to cancel?';
    const puffyButtons = true;

    const root = renderWithDialog({
      cancelButtonText,
      cancelButtonType,
      confirmButtonText,
      confirmButtonType,
      message,
      puffyButtons,
    });

    const confirmDialog = root.find(ConfirmationDialog);
    expect(confirmDialog).toHaveProp('cancelButtonText', cancelButtonText);
    expect(confirmDialog).toHaveProp('cancelButtonType', cancelButtonType);
    expect(confirmDialog).toHaveProp('confirmButtonText', confirmButtonText);
    expect(confirmDialog).toHaveProp('confirmButtonType', confirmButtonType);
    expect(confirmDialog).toHaveProp('message', message);
    expect(confirmDialog).toHaveProp('puffyButtons', puffyButtons);
  });

  it('hides the default button after it is clicked', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    root
      .find('.ConfirmButton-default-button')
      .simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root.find('.ConfirmButton-default-button')).toHaveLength(0);
  });

  it('hides ConfirmationDialog via onCancel', () => {
    const { store } = dispatchClientMetadata();
    const root = renderWithDialog({ store });

    const onCancel = getDialogProp(root, 'onCancel');
    // Simulate a cancellation.
    onCancel(createFakeEvent());

    applyUIStateChanges({ root, store });
    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');
    expect(root.find(ConfirmationDialog)).toHaveLength(0);
  });

  it('handles the onConfirm callback', () => {
    const { store } = dispatchClientMetadata();
    const onConfirmSpy = sinon.spy();
    const root = renderWithDialog({ onConfirm: onConfirmSpy, store });

    const onConfirm = getDialogProp(root, 'onConfirm');

    // Simulate a confirmation.
    const event = createFakeEvent();
    onConfirm(event);
    applyUIStateChanges({ root, store });

    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');
    expect(root.find(ConfirmationDialog)).toHaveLength(0);
    sinon.assert.calledWith(onConfirmSpy, event);
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'special-button';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
