import * as React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';

import I18nProvider from 'core/i18n/Provider';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import DismissibleTextForm, {
  DismissibleTextFormBase,
} from 'ui/components/DismissibleTextForm';

describe(__filename, () => {
  let store;

  const renderProps = (customProps = {}) => {
    return {
      i18n: fakeI18n(),
      onDelete: null,
      onDismiss: sinon.stub(),
      onSubmit: sinon.stub(),
      store,
      ...customProps,
    };
  };

  const shallowRender = (customProps = {}) => {
    const props = renderProps(customProps);
    return shallowUntilTarget(
      <DismissibleTextForm {...props} />,
      DismissibleTextFormBase,
    );
  };

  const mountRender = (customProps = {}) => {
    const props = renderProps(customProps);
    return mount(
      <I18nProvider i18n={props.i18n}>
        <Provider store={props.store}>
          <DismissibleTextForm {...props} />
        </Provider>
      </I18nProvider>,
    );
  };

  const typeSomeText = ({ root, text }) => {
    // Simulate typing in a textarea.
    root.find('.DismissibleTextForm-textarea').simulate(
      'change',
      createFakeEvent({
        target: { value: text },
      }),
    );
  };

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('can be configured with a custom class', () => {
    const root = shallowRender({ className: 'some-class' });

    expect(root).toHaveClassName('some-class');
  });

  it('lets you configure the submit button class', () => {
    const root = shallowRender({ submitButtonClassName: 'my-class' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveClassName(
      'my-class',
    );
  });

  it('renders a placeholder', () => {
    const root = shallowRender({
      placeholder: 'Enter some text',
    });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'placeholder',
      'Enter some text',
    );
  });

  it('lets you render text', () => {
    const root = shallowRender({
      text: 'Some text to edit',
    });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'defaultValue',
      'Some text to edit',
    );
  });

  it('focuses the textarea on mount', () => {
    const root = mountRender();
    // This checks that textarea.focus() was called.
    expect(
      root
        .find('textarea.DismissibleTextForm-textarea')
        .matchesElement(document.activeElement),
    ).toEqual(true);
  });

  it('calls back when dismissing the textarea', () => {
    const onDismiss = sinon.stub();
    const root = shallowRender({
      onDismiss,
    });

    root
      .find('.DismissibleTextForm-dismiss')
      .simulate('click', createFakeEvent());

    sinon.assert.called(onDismiss);
  });

  it('calls back when submitting the form', () => {
    const onSubmit = sinon.stub();
    const root = shallowRender({ onSubmit });
    const enteredText = 'Some review text';

    typeSomeText({ root, text: enteredText });

    // Submit the form.
    const event = createFakeEvent();
    root.find('.DismissibleTextForm-submit').simulate('click', event);

    sinon.assert.calledWith(onSubmit, {
      event,
      text: enteredText,
    });
  });

  it('lets you configure the submit button text', () => {
    const root = shallowRender({
      submitButtonText: 'Submit the form',
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0)).toHaveText(
      'Submit the form',
    );
  });

  it('lets you configure the in-progress submit button text', () => {
    const root = shallowRender({
      submitButtonInProgressText: 'Submitting the form',
      isSubmitting: true,
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0)).toHaveText(
      'Submitting the form',
    );
  });

  it('disables the submit button while submitting the form', () => {
    const root = shallowRender({ isSubmitting: true, text: 'Some text' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables the submit button before text has been entered', () => {
    const root = shallowRender({ text: '' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables submit button before non-empty text has been entered', () => {
    // Enter only white space:
    const root = shallowRender({ text: '    ' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables submit button before the text has changed', () => {
    const root = shallowRender({ text: 'Some text' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables the dismiss button while submitting the form', () => {
    const root = shallowRender({ isSubmitting: true });

    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('enables the dismiss button while not submitting the form', () => {
    const root = shallowRender({ isSubmitting: false });

    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('enables the submit button after text has been entered', () => {
    const root = shallowRender({ text: '' });

    typeSomeText({ root, text: 'Typing some text...' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('disables the textarea when submitting the form', () => {
    const root = shallowRender({ isSubmitting: true });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('enables the textarea when not submitting the form', () => {
    const root = shallowRender({ isSubmitting: false });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('hides the delete button when onDelete is empty', () => {
    const root = shallowRender({ onDelete: null });

    expect(root.find('.DismissibleTextForm-delete')).toHaveLength(0);
  });

  it('displays the delete button when onDelete is provided', () => {
    const root = shallowRender({ onDelete: sinon.stub() });

    const deleteButton = root.find('.DismissibleTextForm-delete');
    expect(deleteButton).toHaveLength(1);
    expect(deleteButton).toHaveProp('buttonType', 'alert');
    expect(deleteButton.childAt(0)).toHaveText('Delete');
  });

  it('creates micro buttons when requested', () => {
    const root = shallowRender({ onDelete: sinon.stub(), microButtons: true });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('micro', true);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('micro', true);
  });

  it('creates puffy buttons when requested', () => {
    const root = shallowRender({ puffyButtons: true, onDelete: sinon.stub() });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('puffy', true);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('puffy', true);
  });

  it('creates non-micro, non-puffy buttons by default', () => {
    const root = shallowRender({ onDelete: sinon.stub() });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('micro', false);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('micro', false);
    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('puffy', false);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('puffy', false);
  });

  it('cannot create conflicting button types', () => {
    expect(() => {
      shallowRender({ puffyButtons: true, microButtons: true });
    }).toThrow(/microButtons and puffyButtons cannot both be true/);
  });

  it('disables the delete button when there is no text', () => {
    const root = shallowRender({ onDelete: sinon.stub(), text: '' });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('enables the delete button after text has been entered', () => {
    const root = shallowRender({ onDelete: sinon.stub(), text: '' });

    typeSomeText({ root, text: 'Typing some text...' });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('calls back when clicking the delete button', () => {
    const onDelete = sinon.stub();
    const root = shallowRender({ onDelete });
    const enteredText = 'Some review text';

    typeSomeText({ root, text: enteredText });

    // Submit the form.
    const event = createFakeEvent();
    root.find('.DismissibleTextForm-delete').simulate('click', event);

    sinon.assert.called(event.preventDefault);
    sinon.assert.called(onDelete);
  });

  it('can hide the cancel/dismiss button', () => {
    const root = shallowRender({ onDismiss: undefined });

    expect(root.find('.DismissibleTextForm-dismiss')).toHaveLength(0);
  });

  it('hides a formFooter by default', () => {
    const root = shallowRender();

    expect(root.find('.DismissibleTextForm-formFooter')).toHaveLength(0);
  });

  it('renders a formFooter', () => {
    const root = shallowRender({
      formFooter: <div className="custom-formFooter" />,
    });

    expect(root.find('.DismissibleTextForm-formFooter')).toHaveLength(1);
    expect(
      root.find('.DismissibleTextForm-formFooter .custom-formFooter'),
    ).toHaveLength(1);
  });
});
